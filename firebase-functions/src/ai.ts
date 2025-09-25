import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini Pro
const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export const aiFunctions = {
  // Generate quiz questions using Gemini Pro
  generateQuizQuestions: async (params: {
    subject: string;
    difficulty: string;
    questionCount: number;
    topic?: string;
  }) => {
    const { subject, difficulty, questionCount, topic } = params;
    
    const prompt = `Generate ${questionCount} ${difficulty} level multiple choice questions about ${topic || subject}.

Requirements:
- Each question should have 4 options (A, B, C, D)
- Only one correct answer per question
- Include a brief explanation for the correct answer
- Make questions engaging and educational
- Vary question types and complexity within the ${difficulty} level
- Focus on ${topic ? `the specific topic: ${topic}` : `general ${subject} concepts`}

Return the response in this exact JSON format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct",
      "points": 1
    }
  ]
}

Difficulty levels:
- easy: Basic concepts, simple recall
- medium: Application of concepts, some analysis
- hard: Complex analysis, synthesis, evaluation`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const aiResponse = JSON.parse(jsonMatch[0]);
      
      // Transform to our format
      const questions = aiResponse.questions.map((q: any, index: number) => ({
        id: `q_${Date.now()}_${index}`,
        type: 'multiple_choice',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points || 1,
        timeLimit: difficulty === 'hard' ? 90 : difficulty === 'medium' ? 60 : 45
      }));
      
      return questions;
    } catch (error) {
      console.error('Error generating quiz questions:', error);
      throw new Error('Failed to generate quiz questions');
    }
  },

  // Generate badge suggestions
  generateBadge: async (params: {
    achievement: string;
    category: string;
    subject?: string;
    customContext?: string;
  }) => {
    const { achievement, category, subject, customContext } = params;
    
    const prompt = `Create a badge for a gamified learning system based on this achievement: "${achievement}"

Context:
- Category: ${category}
- Subject: ${subject || 'General'}
- Additional context: ${customContext || 'None'}

Badge categories and their characteristics:
- achievement: Performance milestones (high scores, completions)
- streak: Consistency rewards (daily practice, streak milestones)
- subject: Subject-specific mastery
- social: Peer interaction (helping others, team activities)
- special: Unique accomplishments (creative solutions, exceptional effort)

Return the response in this exact JSON format:
{
  "name": "Badge Name (2-4 words)",
  "description": "Clear description of what this badge represents",
  "criteria": "Specific criteria for earning this badge",
  "rarity": "common/rare/epic/legendary",
  "xpValue": 50,
  "motivationalMessage": "Congratulatory message when earned"
}

Make the badge:
- Motivating and achievable
- Clear in its requirements
- Appropriate for the difficulty/rarity level
- Encouraging for continued learning`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const badgeData = JSON.parse(jsonMatch[0]);
      
      return {
        name: badgeData.name,
        description: badgeData.description,
        category,
        criteria: {
          type: 'custom',
          description: badgeData.criteria
        },
        rarity: badgeData.rarity || 'common',
        xpValue: badgeData.xpValue || 50,
        generatedByAI: true,
        aiPrompt: prompt.substring(0, 200) + '...',
        motivationalMessage: badgeData.motivationalMessage
      };
    } catch (error) {
      console.error('Error generating badge:', error);
      throw new Error('Failed to generate badge');
    }
  },

  // Generate class insights
  generateClassInsights: async (classData: {
    className: string;
    studentCount: number;
    avgScore: number;
    completionRate: number;
    topSubjects: string[];
    weakSubjects: string[];
    streakData: any[];
    recentQuizzes: any[];
  }) => {
    const prompt = `Analyze this class performance data and provide educational insights:

Class: ${classData.className}
Students: ${classData.studentCount}
Average Score: ${classData.avgScore}%
Completion Rate: ${classData.completionRate}%
Strong Subjects: ${classData.topSubjects.join(', ')}
Weak Subjects: ${classData.weakSubjects.join(', ')}

Recent activity summary:
- Active streaks: ${classData.streakData.filter(s => s.currentStreak > 0).length} students
- Average streak: ${classData.streakData.reduce((sum, s) => sum + s.currentStreak, 0) / classData.streakData.length} days
- Recent quizzes completed: ${classData.recentQuizzes.length}

Provide insights in this JSON format:
{
  "overallPerformance": "Brief assessment of class performance",
  "strengths": ["List of class strengths"],
  "areasForImprovement": ["List of areas needing attention"],
  "recommendations": [
    {
      "action": "Specific action to take",
      "reason": "Why this action would help",
      "priority": "high/medium/low"
    }
  ],
  "motivationalMessage": "Encouraging message for the teacher",
  "suggestedQuizTopics": ["Topic suggestions for struggling areas"]
}

Focus on:
- Actionable insights for the teacher
- Student engagement strategies
- Personalized learning approaches
- Gamification opportunities`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error generating class insights:', error);
      throw new Error('Failed to generate class insights');
    }
  },

  // Generate personalized study recommendations
  generateStudyRecommendations: async (studentData: {
    studentName: string;
    currentLevel: number;
    xp: number;
    weakSubjects: string[];
    strongSubjects: string[];
    recentScores: number[];
    streakData: any;
    badges: string[];
  }) => {
    const avgScore = studentData.recentScores.reduce((sum, score) => sum + score, 0) / studentData.recentScores.length;
    
    const prompt = `Create personalized study recommendations for this student:

Student: ${studentData.studentName}
Level: ${studentData.currentLevel} (${studentData.xp} XP)
Average Recent Score: ${avgScore.toFixed(1)}%
Current Streak: ${studentData.streakData.currentStreak} days
Strong Subjects: ${studentData.strongSubjects.join(', ')}
Areas for Improvement: ${studentData.weakSubjects.join(', ')}
Badges Earned: ${studentData.badges.length}

Generate recommendations in this JSON format:
{
  "personalizedMessage": "Encouraging personal message addressing their progress",
  "studyPlan": {
    "focusAreas": ["List of 2-3 specific topics to focus on"],
    "dailyGoals": ["Achievable daily learning goals"],
    "weeklyTargets": ["Weekly milestone targets"]
  },
  "motivationalTips": ["Study tips and motivation strategies"],
  "nextBadgeOpportunities": [
    {
      "badgeName": "Suggested badge name",
      "description": "What they need to do to earn it",
      "difficulty": "easy/medium/hard"
    }
  ],
  "practiceQuestions": [
    {
      "subject": "Subject area",
      "question": "Sample practice question",
      "hint": "Helpful hint for solving"
    }
  ]
}

Make recommendations:
- Specific and actionable
- Appropriate for their current level
- Encouraging and motivating
- Focused on improvement areas while building on strengths`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error generating study recommendations:', error);
      throw new Error('Failed to generate study recommendations');
    }
  }
};

// HTTP endpoints for AI functions
export const generateQuiz = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  try {
    const questions = await aiFunctions.generateQuizQuestions(data);
    return { questions, success: true };
  } catch (error) {
    console.error('Error in generateQuiz function:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate quiz');
  }
});

export const generateBadgeSuggestion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  try {
    const badge = await aiFunctions.generateBadge(data);
    return { badge, success: true };
  } catch (error) {
    console.error('Error in generateBadgeSuggestion function:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate badge');
  }
});

export const getClassInsights = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  try {
    const insights = await aiFunctions.generateClassInsights(data);
    return { insights, success: true };
  } catch (error) {
    console.error('Error in getClassInsights function:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate insights');
  }
});

export const getStudyRecommendations = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  try {
    const recommendations = await aiFunctions.generateStudyRecommendations(data);
    return { recommendations, success: true };
  } catch (error) {
    console.error('Error in getStudyRecommendations function:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate recommendations');
  }
});