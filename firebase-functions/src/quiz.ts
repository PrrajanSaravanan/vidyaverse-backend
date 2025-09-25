import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { aiFunctions } from './ai';

const db = admin.firestore();

export const quizFunctions = {
  // Create a new quiz
  createQuiz: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { title, description, questions, assignedTo, timeLimit, difficulty, subject, xpReward } = data;
    
    try {
      const quizData = {
        title,
        description: description || '',
        createdBy: context.auth.uid,
        questions: questions || [],
        timeLimit: timeLimit || 600, // 10 minutes default
        difficulty: difficulty || 'medium',
        subject: subject || 'General',
        assignedTo,
        xpReward: xpReward || 10,
        perfectScoreBonus: Math.round(xpReward * 0.5),
        allowRetakes: true,
        showCorrectAnswers: true,
        shuffleQuestions: false,
        generatedByAI: false,
        totalAttempts: 0,
        averageScore: 0,
        completionRate: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      };

      const quizRef = await db.collection('quizzes').add(quizData);
      
      // Send notifications to assigned students
      await sendQuizAssignmentNotifications(quizRef.id, assignedTo);
      
      return { quizId: quizRef.id, success: true };
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create quiz');
    }
  }),

  // Generate AI quiz
  generateAIQuiz: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { subject, difficulty, questionCount, topic, assignedTo } = data;
    
    try {
      // Generate questions using AI
      const questions = await aiFunctions.generateQuizQuestions({
        subject,
        difficulty,
        questionCount: questionCount || 5,
        topic
      });

      const quizData = {
        title: `AI Generated Quiz: ${topic || subject}`,
        description: `Auto-generated ${difficulty} level quiz on ${topic || subject}`,
        createdBy: context.auth.uid,
        questions,
        timeLimit: questionCount * 60, // 1 minute per question
        difficulty,
        subject,
        assignedTo,
        xpReward: questionCount * 2,
        perfectScoreBonus: questionCount,
        allowRetakes: true,
        showCorrectAnswers: true,
        shuffleQuestions: true,
        generatedByAI: true,
        aiPrompt: `Generate ${questionCount} ${difficulty} questions about ${topic || subject}`,
        totalAttempts: 0,
        averageScore: 0,
        completionRate: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      };

      const quizRef = await db.collection('quizzes').add(quizData);
      
      // Send notifications to assigned students
      await sendQuizAssignmentNotifications(quizRef.id, assignedTo);
      
      return { quizId: quizRef.id, questions, success: true };
    } catch (error) {
      console.error('Error generating AI quiz:', error);
      throw new functions.https.HttpsError('internal', 'Failed to generate AI quiz');
    }
  }),

  // Submit quiz attempt
  submitQuizAttempt: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { quizId, answers, timeSpent } = data;
    const userId = context.auth.uid;
    
    try {
      // Get quiz data
      const quizDoc = await db.collection('quizzes').doc(quizId).get();
      if (!quizDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Quiz not found');
      }
      
      const quiz = quizDoc.data()!;
      
      // Calculate score
      const result = calculateQuizScore(quiz.questions, answers);
      
      // Calculate XP earned
      let xpEarned = Math.round((result.score / 100) * quiz.xpReward);
      if (result.score === 100) {
        xpEarned += quiz.perfectScoreBonus;
      }
      
      // Save result
      const resultData = {
        userId,
        quizId,
        answers,
        score: result.score,
        correctAnswers: result.correctCount,
        totalQuestions: quiz.questions.length,
        xpEarned,
        timeSpent: timeSpent || 0,
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('quizzes').doc(quizId).collection('results').doc(userId).set(resultData);
      
      // Update quiz statistics
      await updateQuizStatistics(quizId);
      
      return { 
        score: result.score, 
        xpEarned, 
        correctAnswers: result.correctCount,
        totalQuestions: quiz.questions.length,
        success: true 
      };
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw new functions.https.HttpsError('internal', 'Failed to submit quiz');
    }
  }),

  // Get quiz results for teacher
  getQuizResults: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { quizId } = data;
    
    try {
      // Verify teacher owns this quiz
      const quizDoc = await db.collection('quizzes').doc(quizId).get();
      if (!quizDoc.exists || quizDoc.data()!.createdBy !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Access denied');
      }
      
      // Get all results
      const resultsSnapshot = await db.collection('quizzes').doc(quizId).collection('results').get();
      const results = resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Get student names
      const userIds = results.map(r => r.userId);
      const usersSnapshot = await db.collection('users').where('uid', 'in', userIds).get();
      const userMap = new Map();
      usersSnapshot.docs.forEach(doc => {
        userMap.set(doc.id, doc.data().displayName);
      });
      
      // Combine results with student names
      const enrichedResults = results.map(result => ({
        ...result,
        studentName: userMap.get(result.userId) || 'Unknown'
      }));
      
      return { results: enrichedResults, success: true };
    } catch (error) {
      console.error('Error getting quiz results:', error);
      throw new functions.https.HttpsError('internal', 'Failed to get quiz results');
    }
  })
};

// Helper functions
async function sendQuizAssignmentNotifications(quizId: string, assignedTo: any) {
  try {
    let studentIds: string[] = [];
    
    if (assignedTo.type === 'class') {
      const classDoc = await db.collection('classes').doc(assignedTo.classId).get();
      if (classDoc.exists) {
        studentIds = classDoc.data()!.studentIds || [];
      }
    } else if (assignedTo.type === 'students') {
      studentIds = assignedTo.studentIds || [];
    }
    
    // Create notifications for each student
    const batch = db.batch();
    studentIds.forEach(studentId => {
      const notificationRef = db.collection('notifications').doc(studentId).collection('messages').doc();
      batch.set(notificationRef, {
        userId: studentId,
        type: 'quiz_assigned',
        title: 'New Quiz Assigned',
        message: 'You have a new quiz to complete!',
        data: { quizId },
        isRead: false,
        isArchived: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error sending quiz assignment notifications:', error);
  }
}

function calculateQuizScore(questions: any[], answers: Record<string, any>) {
  let correctCount = 0;
  
  questions.forEach((question, index) => {
    const userAnswer = answers[question.id] || answers[index.toString()];
    if (userAnswer === question.correctAnswer) {
      correctCount++;
    }
  });
  
  const score = Math.round((correctCount / questions.length) * 100);
  return { score, correctCount };
}

async function updateQuizStatistics(quizId: string) {
  try {
    const resultsSnapshot = await db.collection('quizzes').doc(quizId).collection('results').get();
    const results = resultsSnapshot.docs.map(doc => doc.data());
    
    const totalAttempts = results.length;
    const averageScore = results.reduce((sum, result) => sum + result.score, 0) / totalAttempts;
    const completionRate = 100; // All results represent completions
    
    await db.collection('quizzes').doc(quizId).update({
      totalAttempts,
      averageScore: Math.round(averageScore),
      completionRate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating quiz statistics:', error);
  }
}