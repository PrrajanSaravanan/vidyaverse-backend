import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { aiFunctions } from './ai';

const db = admin.firestore();
const realtime = admin.database();

export const battleFunctions = {
  // Create a new battle room
  createBattle: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { type, maxParticipants, timePerQuestion, totalQuestions, subject, difficulty, quizId } = data;
    const userId = context.auth.uid;
    
    try {
      let questions = [];
      
      if (quizId) {
        // Use existing quiz
        const quizDoc = await db.collection('quizzes').doc(quizId).get();
        if (quizDoc.exists) {
          questions = quizDoc.data()!.questions;
        }
      } else {
        // Generate AI questions for battle
        questions = await aiFunctions.generateQuizQuestions({
          subject: subject || 'General Knowledge',
          difficulty: difficulty || 'medium',
          questionCount: totalQuestions || 5
        });
      }
      
      const battleData = {
        type: type || 'peer_vs_peer',
        status: 'waiting',
        participants: [{
          userId,
          displayName: context.auth.token.name || 'Player',
          currentScore: 0,
          completedQuestions: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp()
        }],
        questions,
        currentQuestionIndex: 0,
        maxParticipants: maxParticipants || 2,
        timePerQuestion: timePerQuestion || 30,
        totalQuestions: questions.length,
        leaderboard: [],
        activeConnections: [userId],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: userId
      };

      const battleRef = await db.collection('battles').add(battleData);
      
      // Create real-time battle room
      await realtime.ref(`battles/${battleRef.id}`).set({
        status: 'waiting',
        currentQuestion: 0,
        participants: {
          [userId]: {
            connected: true,
            score: 0,
            answers: {}
          }
        }
      });
      
      return { battleId: battleRef.id, success: true };
    } catch (error) {
      console.error('Error creating battle:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create battle');
    }
  }),

  // Join an existing battle
  joinBattle: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { battleId } = data;
    const userId = context.auth.uid;
    
    try {
      const battleRef = db.collection('battles').doc(battleId);
      const battleDoc = await battleRef.get();
      
      if (!battleDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Battle not found');
      }
      
      const battle = battleDoc.data()!;
      
      if (battle.status !== 'waiting') {
        throw new functions.https.HttpsError('failed-precondition', 'Battle already started');
      }
      
      if (battle.participants.length >= battle.maxParticipants) {
        throw new functions.https.HttpsError('failed-precondition', 'Battle is full');
      }
      
      // Check if user already joined
      const existingParticipant = battle.participants.find((p: any) => p.userId === userId);
      if (existingParticipant) {
        return { success: true, message: 'Already joined' };
      }
      
      // Add participant
      await battleRef.update({
        participants: admin.firestore.FieldValue.arrayUnion({
          userId,
          displayName: context.auth.token.name || 'Player',
          currentScore: 0,
          completedQuestions: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp()
        }),
        activeConnections: admin.firestore.FieldValue.arrayUnion(userId)
      });
      
      // Update real-time data
      await realtime.ref(`battles/${battleId}/participants/${userId}`).set({
        connected: true,
        score: 0,
        answers: {}
      });
      
      // Start battle if full
      const updatedBattle = await battleRef.get();
      const updatedData = updatedBattle.data()!;
      
      if (updatedData.participants.length === updatedData.maxParticipants) {
        await startBattle(battleId);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error joining battle:', error);
      throw new functions.https.HttpsError('internal', 'Failed to join battle');
    }
  }),

  // Submit answer during battle
  submitBattleAnswer: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { battleId, questionIndex, answer, timeRemaining } = data;
    const userId = context.auth.uid;
    
    try {
      const battleRef = db.collection('battles').doc(battleId);
      const battleDoc = await battleRef.get();
      
      if (!battleDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Battle not found');
      }
      
      const battle = battleDoc.data()!;
      
      if (battle.status !== 'active') {
        throw new functions.https.HttpsError('failed-precondition', 'Battle not active');
      }
      
      // Get the question
      const question = battle.questions[questionIndex];
      if (!question) {
        throw new functions.https.HttpsError('not-found', 'Question not found');
      }
      
      // Calculate points (more points for faster answers)
      const isCorrect = answer === question.correctAnswer;
      let points = 0;
      
      if (isCorrect) {
        const basePoints = question.points || 1;
        const timeBonus = Math.max(0, timeRemaining / battle.timePerQuestion);
        points = Math.round(basePoints * 100 * (1 + timeBonus * 0.5));
      }
      
      // Update real-time data
      await realtime.ref(`battles/${battleId}/participants/${userId}/answers/${questionIndex}`).set({
        answer,
        correct: isCorrect,
        points,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });
      
      await realtime.ref(`battles/${battleId}/participants/${userId}/score`).set(
        admin.database.ServerValue.increment(points)
      );
      
      return { 
        correct: isCorrect, 
        points,
        explanation: question.explanation,
        success: true 
      };
    } catch (error) {
      console.error('Error submitting battle answer:', error);
      throw new functions.https.HttpsError('internal', 'Failed to submit answer');
    }
  }),

  // Find and join random battle
  findBattle: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { subject, difficulty } = data;
    const userId = context.auth.uid;
    
    try {
      // Look for waiting battles
      const battlesQuery = db.collection('battles')
        .where('status', '==', 'waiting')
        .where('type', '==', 'peer_vs_peer')
        .limit(10);
      
      const battlesSnapshot = await battlesQuery.get();
      
      for (const battleDoc of battlesSnapshot.docs) {
        const battle = battleDoc.data();
        
        // Check if battle has space and user hasn't joined
        if (battle.participants.length < battle.maxParticipants &&
            !battle.participants.some((p: any) => p.userId === userId)) {
          
          // Join this battle
          await battleFunctions.joinBattle({ battleId: battleDoc.id }, context);
          return { battleId: battleDoc.id, found: true, success: true };
        }
      }
      
      // No suitable battle found, create new one
      const createResult = await battleFunctions.createBattle({
        type: 'peer_vs_peer',
        subject,
        difficulty,
        maxParticipants: 2,
        timePerQuestion: 30,
        totalQuestions: 5
      }, context);
      
      return { ...createResult, found: false };
    } catch (error) {
      console.error('Error finding battle:', error);
      throw new functions.https.HttpsError('internal', 'Failed to find battle');
    }
  }),

  // Get battle results
  getBattleResults: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { battleId } = data;
    
    try {
      const battleDoc = await db.collection('battles').doc(battleId).get();
      
      if (!battleDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Battle not found');
      }
      
      const battle = battleDoc.data()!;
      
      if (battle.status !== 'completed') {
        throw new functions.https.HttpsError('failed-precondition', 'Battle not completed');
      }
      
      return { 
        leaderboard: battle.leaderboard,
        winner: battle.winner,
        questions: battle.questions,
        success: true 
      };
    } catch (error) {
      console.error('Error getting battle results:', error);
      throw new functions.https.HttpsError('internal', 'Failed to get battle results');
    }
  })
};

// Helper functions
async function startBattle(battleId: string) {
  try {
    await db.collection('battles').doc(battleId).update({
      status: 'active',
      startedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await realtime.ref(`battles/${battleId}/status`).set('active');
    await realtime.ref(`battles/${battleId}/startTime`).set(admin.database.ServerValue.TIMESTAMP);
    
    // Schedule battle completion
    setTimeout(async () => {
      await completeBattle(battleId);
    }, 5 * 60 * 1000); // 5 minutes max battle time
    
  } catch (error) {
    console.error('Error starting battle:', error);
  }
}

async function completeBattle(battleId: string) {
  try {
    // Get real-time battle data
    const battleSnapshot = await realtime.ref(`battles/${battleId}`).once('value');
    const realtimeData = battleSnapshot.val();
    
    if (!realtimeData || realtimeData.status === 'completed') {
      return;
    }
    
    // Calculate final scores and rankings
    const participants = Object.entries(realtimeData.participants || {});
    const leaderboard = participants
      .map(([userId, data]: [string, any]) => ({
        userId,
        score: data.score || 0,
        rank: 0,
        xpEarned: 0
      }))
      .sort((a, b) => b.score - a.score)
      .map((participant, index) => {
        const rank = index + 1;
        const xpEarned = rank === 1 ? 50 : rank === 2 ? 30 : 20; // Winner gets more XP
        return { ...participant, rank, xpEarned };
      });
    
    const winner = leaderboard[0]?.userId;
    
    // Update Firestore
    await db.collection('battles').doc(battleId).update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      leaderboard,
      winner
    });
    
    // Update real-time
    await realtime.ref(`battles/${battleId}/status`).set('completed');
    await realtime.ref(`battles/${battleId}/leaderboard`).set(leaderboard);
    
    // Award XP to participants
    const batch = db.batch();
    leaderboard.forEach(participant => {
      const userRef = db.collection('users').doc(participant.userId);
      batch.update(userRef, {
        xp: admin.firestore.FieldValue.increment(participant.xpEarned),
        totalBattlesWon: participant.rank === 1 ? 
          admin.firestore.FieldValue.increment(1) : 
          admin.firestore.FieldValue.increment(0)
      });
    });
    await batch.commit();
    
  } catch (error) {
    console.error('Error completing battle:', error);
  }
}

// Real-time triggers
export const onBattleDisconnect = functions.database
  .ref('/battles/{battleId}/participants/{userId}/connected')
  .onDelete(async (snapshot, context) => {
    const { battleId, userId } = context.params;
    
    try {
      // Remove from active connections
      await db.collection('battles').doc(battleId).update({
        activeConnections: admin.firestore.FieldValue.arrayRemove(userId)
      });
      
      // Check if battle should be cancelled due to no active participants
      const battleDoc = await db.collection('battles').doc(battleId).get();
      const battle = battleDoc.data();
      
      if (battle && battle.activeConnections.length === 0 && battle.status === 'waiting') {
        await db.collection('battles').doc(battleId).update({
          status: 'cancelled'
        });
      }
    } catch (error) {
      console.error('Error handling battle disconnect:', error);
    }
  });