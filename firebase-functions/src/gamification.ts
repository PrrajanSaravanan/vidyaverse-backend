import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const gamificationFunctions = {
  // Award XP to a user
  awardXP: async (userId: string, xpAmount: number) => {
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data()!;
      const currentXP = userData.xp || 0;
      const newXP = currentXP + xpAmount;
      
      // Calculate new level (every 100 XP = 1 level)
      const newLevel = Math.floor(newXP / 100) + 1;
      const oldLevel = Math.floor(currentXP / 100) + 1;
      
      // Update user
      await userRef.update({
        xp: newXP,
        level: newLevel,
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Check for level up
      if (newLevel > oldLevel) {
        await handleLevelUp(userId, newLevel);
      }
      
      return { newXP, newLevel, leveledUp: newLevel > oldLevel };
    } catch (error) {
      console.error('Error awarding XP:', error);
      throw error;
    }
  },

  // Update user's streak
  updateStreak: async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const streakRef = db.collection('streaks').doc(userId);
      const streakDoc = await streakRef.get();
      
      if (!streakDoc.exists) {
        // Create new streak record
        await streakRef.set({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: admin.firestore.FieldValue.serverTimestamp(),
          streakHistory: [{
            date: today,
            activityCompleted: true,
            xpEarned: 0,
            quizzesCompleted: 1
          }],
          rewardsEarned: [],
          reminderEnabled: true,
          reminderTime: '18:00',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { currentStreak: 1, streakBroken: false };
      }
      
      const streakData = streakDoc.data()!;
      const lastActivity = streakData.lastActivityDate?.toDate();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      let currentStreak = streakData.currentStreak || 0;
      let streakBroken = false;
      
      // Check if activity was yesterday (continuing streak) or today (same day)
      if (lastActivity) {
        const lastActivityDate = lastActivity.toISOString().split('T')[0];
        const yesterdayDate = yesterday.toISOString().split('T')[0];
        
        if (lastActivityDate === today) {
          // Same day, don't increment streak
          return { currentStreak, streakBroken: false };
        } else if (lastActivityDate === yesterdayDate) {
          // Continuing streak
          currentStreak += 1;
        } else {
          // Streak broken, reset to 1
          currentStreak = 1;
          streakBroken = true;
        }
      } else {
        currentStreak = 1;
      }
      
      const longestStreak = Math.max(streakData.longestStreak || 0, currentStreak);
      
      // Update streak record
      await streakRef.update({
        currentStreak,
        longestStreak,
        lastActivityDate: admin.firestore.FieldValue.serverTimestamp(),
        streakHistory: admin.firestore.FieldValue.arrayUnion({
          date: today,
          activityCompleted: true,
          xpEarned: 0,
          quizzesCompleted: 1
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user's streak info
      await db.collection('users').doc(userId).update({
        currentStreak,
        longestStreak
      });
      
      // Check for streak milestone rewards
      await checkStreakRewards(userId, currentStreak);
      
      return { currentStreak, streakBroken };
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  },

  // Check badge eligibility for a user
  checkBadgeEligibility: async (userId: string) => {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return;
      
      const userData = userDoc.data()!;
      const earnedBadges = userData.badges || [];
      
      // Get all available badges
      const badgesSnapshot = await db.collection('badges')
        .where('isActive', '==', true)
        .get();
      
      const newBadges: string[] = [];
      
      for (const badgeDoc of badgesSnapshot.docs) {
        const badge = badgeDoc.data();
        const badgeId = badgeDoc.id;
        
        // Skip if already earned
        if (earnedBadges.includes(badgeId)) continue;
        
        // Check if user meets criteria
        if (await checkBadgeCriteria(userId, badge, userData)) {
          await awardBadge(userId, badgeId, badge);
          newBadges.push(badgeId);
        }
      }
      
      return newBadges;
    } catch (error) {
      console.error('Error checking badge eligibility:', error);
      throw error;
    }
  },

  // Update leaderboards
  updateLeaderboards: async (userId: string) => {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return;
      
      const userData = userDoc.data()!;
      
      // Update global leaderboard
      await updateLeaderboard('global', 'global', userId, userData);
      
      // Update class leaderboards
      if (userData.classIds && userData.classIds.length > 0) {
        for (const classId of userData.classIds) {
          await updateLeaderboard('class', classId, userId, userData);
        }
      }
      
    } catch (error) {
      console.error('Error updating leaderboards:', error);
      throw error;
    }
  },

  // Create custom badge
  createBadge: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { name, description, criteria, category, rarity, xpValue, classIds } = data;
    
    try {
      const badgeData = {
        name,
        description,
        category: category || 'custom',
        criteria: {
          type: 'custom',
          description: criteria
        },
        rarity: rarity || 'common',
        xpValue: xpValue || 50,
        createdBy: context.auth.uid,
        generatedByAI: false,
        isActive: true,
        isPublic: !classIds,
        classIds: classIds || null,
        timesEarned: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const badgeRef = await db.collection('badges').add(badgeData);
      return { badgeId: badgeRef.id, success: true };
    } catch (error) {
      console.error('Error creating badge:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create badge');
    }
  }),

  // Manually award badge to student
  awardBadgeToStudent: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { studentId, badgeId, reason } = data;
    
    try {
      // Verify teacher has permission
      const badgeDoc = await db.collection('badges').doc(badgeId).get();
      if (!badgeDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Badge not found');
      }
      
      const badge = badgeDoc.data()!;
      if (badge.createdBy !== context.auth.uid && !badge.isPublic) {
        throw new functions.https.HttpsError('permission-denied', 'Access denied');
      }
      
      await awardBadge(studentId, badgeId, badge, reason);
      return { success: true };
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw new functions.https.HttpsError('internal', 'Failed to award badge');
    }
  }),

  // Get user's gamification stats
  getGamificationStats: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId } = data;
    const requestingUserId = context.auth.uid;
    
    // Users can only access their own stats unless they're a teacher
    if (userId !== requestingUserId) {
      // TODO: Check if requesting user is a teacher with access to this student
    }
    
    try {
      const [userDoc, streakDoc, badgesSnapshot] = await Promise.all([
        db.collection('users').doc(userId).get(),
        db.collection('streaks').doc(userId).get(),
        db.collection('users').doc(userId).collection('earnedBadges').get()
      ]);
      
      const userData = userDoc.data() || {};
      const streakData = streakDoc.data() || {};
      const earnedBadges = badgesSnapshot.docs.map(doc => doc.data());
      
      return {
        xp: userData.xp || 0,
        level: userData.level || 1,
        currentStreak: userData.currentStreak || 0,
        longestStreak: userData.longestStreak || 0,
        totalQuizzesCompleted: userData.totalQuizzesCompleted || 0,
        totalBattlesWon: userData.totalBattlesWon || 0,
        averageScore: userData.averageScore || 0,
        badges: earnedBadges,
        streakHistory: streakData.streakHistory || [],
        success: true
      };
    } catch (error) {
      console.error('Error getting gamification stats:', error);
      throw new functions.https.HttpsError('internal', 'Failed to get stats');
    }
  })
};

// Helper functions
async function handleLevelUp(userId: string, newLevel: number) {
  try {
    // Award level up XP bonus
    const bonusXP = newLevel * 10;
    await db.collection('users').doc(userId).update({
      xp: admin.firestore.FieldValue.increment(bonusXP)
    });
    
    // Send level up notification
    const notificationRef = db.collection('notifications').doc(userId).collection('messages').doc();
    await notificationRef.set({
      userId,
      type: 'level_up',
      title: 'Level Up!',
      message: `Congratulations! You've reached level ${newLevel}!`,
      data: { level: newLevel, bonusXP },
      isRead: false,
      isArchived: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Check for level-based badges
    await checkLevelBadges(userId, newLevel);
    
  } catch (error) {
    console.error('Error handling level up:', error);
  }
}

async function checkStreakRewards(userId: string, streak: number) {
  try {
    const milestones = [7, 14, 30, 60, 100]; // Days
    
    if (milestones.includes(streak)) {
      const rewardXP = streak * 2;
      
      // Award XP
      await db.collection('users').doc(userId).update({
        xp: admin.firestore.FieldValue.increment(rewardXP)
      });
      
      // Record reward
      await db.collection('streaks').doc(userId).update({
        rewardsEarned: admin.firestore.FieldValue.arrayUnion({
          streakDay: streak,
          rewardType: 'xp',
          rewardValue: rewardXP.toString(),
          earnedAt: admin.firestore.FieldValue.serverTimestamp()
        })
      });
      
      // Send notification
      const notificationRef = db.collection('notifications').doc(userId).collection('messages').doc();
      await notificationRef.set({
        userId,
        type: 'streak_milestone',
        title: 'Streak Milestone!',
        message: `Amazing! You've maintained a ${streak}-day streak! Earned ${rewardXP} bonus XP.`,
        data: { streak, rewardXP },
        isRead: false,
        isArchived: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error checking streak rewards:', error);
  }
}

async function checkBadgeCriteria(userId: string, badge: any, userData: any): Promise<boolean> {
  const criteria = badge.criteria;
  
  switch (criteria.type) {
    case 'xp_threshold':
      return userData.xp >= criteria.value;
      
    case 'streak_days':
      return userData.currentStreak >= criteria.value;
      
    case 'quiz_completion':
      return userData.totalQuizzesCompleted >= criteria.value;
      
    case 'perfect_score':
      // Would need to check quiz results for perfect scores
      return false; // Placeholder
      
    case 'battle_wins':
      return userData.totalBattlesWon >= criteria.value;
      
    case 'level_threshold':
      return userData.level >= criteria.value;
      
    default:
      return false;
  }
}

async function awardBadge(userId: string, badgeId: string, badge: any, reason?: string) {
  try {
    // Add badge to user
    await db.collection('users').doc(userId).update({
      badges: admin.firestore.FieldValue.arrayUnion(badgeId)
    });
    
    // Create earned badge record
    await db.collection('users').doc(userId).collection('earnedBadges').doc(badgeId).set({
      badgeId,
      earnedAt: admin.firestore.FieldValue.serverTimestamp(),
      reason: reason || 'Criteria met',
      xpAwarded: badge.xpValue
    });
    
    // Award XP
    await db.collection('users').doc(userId).update({
      xp: admin.firestore.FieldValue.increment(badge.xpValue)
    });
    
    // Update badge statistics
    await db.collection('badges').doc(badgeId).update({
      timesEarned: admin.firestore.FieldValue.increment(1),
      firstEarnedBy: badge.timesEarned === 0 ? userId : badge.firstEarnedBy
    });
    
  } catch (error) {
    console.error('Error awarding badge:', error);
    throw error;
  }
}

async function updateLeaderboard(type: string, scopeId: string, userId: string, userData: any) {
  try {
    const leaderboardId = `${type}_${scopeId}_all_time`;
    const leaderboardRef = db.collection('leaderboards').doc(leaderboardId);
    
    const leaderboardDoc = await leaderboardRef.get();
    let rankings = [];
    
    if (leaderboardDoc.exists) {
      rankings = leaderboardDoc.data()!.rankings || [];
    }
    
    // Find user in rankings
    const existingIndex = rankings.findIndex((r: any) => r.userId === userId);
    
    const userRanking = {
      userId,
      displayName: userData.displayName,
      xp: userData.xp,
      level: userData.level,
      streak: userData.currentStreak,
      badges: userData.badges.length,
      rank: 0,
      change: 0
    };
    
    if (existingIndex >= 0) {
      const oldRank = rankings[existingIndex].rank;
      rankings[existingIndex] = userRanking;
      // Sort and recalculate ranks
      rankings.sort((a: any, b: any) => b.xp - a.xp);
      rankings.forEach((ranking: any, index: number) => {
        ranking.rank = index + 1;
        if (ranking.userId === userId) {
          ranking.change = oldRank - ranking.rank;
        }
      });
    } else {
      rankings.push(userRanking);
      rankings.sort((a: any, b: any) => b.xp - a.xp);
      rankings.forEach((ranking: any, index: number) => {
        ranking.rank = index + 1;
      });
    }
    
    await leaderboardRef.set({
      id: leaderboardId,
      type,
      scopeId,
      period: 'all_time',
      rankings: rankings.slice(0, 100), // Keep top 100
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      totalParticipants: rankings.length
    });
    
  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

async function checkLevelBadges(userId: string, level: number) {
  try {
    const levelMilestones = [5, 10, 25, 50, 100];
    
    if (levelMilestones.includes(level)) {
      // Check if level badge exists
      const badgeSnapshot = await db.collection('badges')
        .where('category', '==', 'achievement')
        .where('criteria.type', '==', 'level_threshold')
        .where('criteria.value', '==', level)
        .limit(1)
        .get();
      
      if (!badgeSnapshot.empty) {
        const badge = badgeSnapshot.docs[0];
        await awardBadge(userId, badge.id, badge.data());
      }
    }
  } catch (error) {
    console.error('Error checking level badges:', error);
  }
}