import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { quizFunctions } from './quiz';
import { battleFunctions } from './battle';
import { gamificationFunctions } from './gamification';
import { analyticsF import { aiF functions } from './analytics';unctions } from './ai';
import { notificationFunctions } from './notifications';

// Initialize Firebase Admin
admin.initializeApp();

// Export all function modules
export const quiz = quizFunctions;
export const battle = battleFunctions;
export const gamification = gamificationFunctions;
export const analytics = analyticsFunctions;
export const ai = aiFunctions;
export const notifications = notificationFunctions;

// Auth trigger functions
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    // Create user document with default values
    await admin.firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Student',
      role: 'student', // Default role, can be updated by admin
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      badges: [],
      classIds: [],
      teachingClasses: [],
      totalQuizzesCompleted: 0,
      totalBattlesWon: 0,
      averageScore: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        notifications: true,
        soundEffects: true,
        theme: 'light'
      }
    });

    // Initialize streak tracking
    await admin.firestore().collection('streaks').doc(user.uid).set({
      userId: user.uid,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: admin.firestore.FieldValue.serverTimestamp(),
      streakHistory: [],
      rewardsEarned: [],
      reminderEnabled: true,
      reminderTime: '18:00',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`User ${user.uid} created successfully`);
  } catch (error) {
    console.error('Error creating user:', error);
  }
});

// Firestore trigger functions
export const onQuizComplete = functions.firestore
  .document('quizzes/{quizId}/results/{userId}')
  .onCreate(async (snapshot, context) => {
    const { quizId, userId } = context.params;
    const result = snapshot.data();
    
    try {
      // Award XP and update user stats
      await gamificationFunctions.awardXP(userId, result.xpEarned);
      
      // Update streak
      await gamificationFunctions.updateStreak(userId);
      
      // Check for new badges
      await gamificationFunctions.checkBadgeEligibility(userId);
      
      // Update leaderboards
      await gamificationFunctions.updateLeaderboards(userId);
      
      // Send notification
      await notificationFunctions.sendQuizCompleteNotification(userId, quizId, result);
      
    } catch (error) {
      console.error('Error processing quiz completion:', error);
    }
  });

export const onBadgeEarned = functions.firestore
  .document('users/{userId}/earnedBadges/{badgeId}')
  .onCreate(async (snapshot, context) => {
    const { userId, badgeId } = context.params;
    
    try {
      // Send badge earned notification
      await notificationFunctions.sendBadgeEarnedNotification(userId, badgeId);
      
      // Update badge statistics
      await admin.firestore().collection('badges').doc(badgeId).update({
        timesEarned: admin.firestore.FieldValue.increment(1)
      });
      
    } catch (error) {
      console.error('Error processing badge earned:', error);
    }
  });

// Scheduled functions
export const dailyAnalytics = functions.pubsub
  .schedule('0 2 * * *') // Run at 2 AM daily
  .timeZone('UTC')
  .onRun(async (context) => {
    await analyticsFunctions.generateDailyAnalytics();
  });

export const streakReminders = functions.pubsub
  .schedule('0 18 * * *') // Run at 6 PM daily
  .timeZone('UTC')
  .onRun(async (context) => {
    await notificationFunctions.sendStreakReminders();
  });

export const leaderboardUpdate = functions.pubsub
  .schedule('0 0 * * 1') // Run at midnight every Monday
  .timeZone('UTC')
  .onRun(async (context) => {
    await gamificationFunctions.updateWeeklyLeaderboards();
  });