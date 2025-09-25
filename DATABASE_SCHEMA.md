# Firestore Database Schema

## 📋 Collections Overview

```
📁 users/
📁 classes/
📁 quizzes/
📁 battles/
📁 badges/
📁 streaks/
📁 leaderboards/
📁 notifications/
📁 analytics/
```

## 👤 Users Collection

**Path:** `/users/{userId}`

```typescript
interface User {
  uid: string;                    // Firebase Auth UID
  email: string;
  displayName: string;
  role: 'teacher' | 'student';
  profileImageUrl?: string;
  
  // Student-specific fields
  xp: number;                     // Total experience points
  level: number;                  // Current level (calculated from XP)
  currentStreak: number;          // Current daily streak
  longestStreak: number;          // Best streak ever
  badges: string[];               // Array of badge IDs
  classIds: string[];             // Classes student belongs to
  
  // Teacher-specific fields
  teachingClasses: string[];      // Classes teacher manages
  schoolId?: string;              // School affiliation
  
  // Common fields
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  preferences: {
    notifications: boolean;
    soundEffects: boolean;
    theme: 'light' | 'dark';
  };
  
  // Analytics
  totalQuizzesCompleted: number;
  totalBattlesWon: number;
  averageScore: number;
}
```

## 🏫 Classes Collection

**Path:** `/classes/{classId}`

```typescript
interface Class {
  id: string;
  name: string;                   // "Math 101", "Science Class A"
  description?: string;
  teacherId: string;              // Reference to teacher user
  studentIds: string[];           // Array of student user IDs
  
  // Settings
  subject: string;                // "Mathematics", "Science", etc.
  gradeLevel: string;             // "Grade 5", "High School"
  isActive: boolean;
  
  // Gamification
  classXPPool: number;            // Total XP earned by all students
  leaderboard: {
    studentId: string;
    xp: number;
    rank: number;
    streak: number;
  }[];
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Analytics
  totalQuizzes: number;
  averageClassScore: number;
  mostActiveStudent: string;
}
```

## 📝 Quizzes Collection

**Path:** `/quizzes/{quizId}`

```typescript
interface Quiz {
  id: string;
  title: string;
  description?: string;
  createdBy: string;              // Teacher user ID
  
  // Content
  questions: QuizQuestion[];
  timeLimit?: number;             // in seconds
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  
  // Assignment
  assignedTo: {
    type: 'class' | 'students';
    classId?: string;             // If assigned to class
    studentIds?: string[];        // If assigned to specific students
  };
  
  // Scheduling
  availableFrom?: Timestamp;
  availableUntil?: Timestamp;
  
  // Gamification
  xpReward: number;               // XP given for completion
  perfectScoreBonus: number;      // Extra XP for 100%
  
  // Settings
  allowRetakes: boolean;
  showCorrectAnswers: boolean;
  shuffleQuestions: boolean;
  
  // AI Generation
  generatedByAI: boolean;
  aiPrompt?: string;              // Original prompt used
  
  // Analytics
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];             // For multiple choice
  correctAnswer: string | number;
  explanation?: string;
  points: number;
  timeLimit?: number;             // Per question time limit
}
```

## ⚔️ Battles Collection

**Path:** `/battles/{battleId}`

```typescript
interface Battle {
  id: string;
  type: 'peer_vs_peer' | 'class_tournament';
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  
  // Participants
  participants: {
    userId: string;
    displayName: string;
    currentScore: number;
    completedQuestions: number;
    joinedAt: Timestamp;
    finishedAt?: Timestamp;
  }[];
  
  // Quiz Content
  quizId?: string;                // If using existing quiz
  questions: QuizQuestion[];      // Battle-specific questions
  currentQuestionIndex: number;
  
  // Settings
  maxParticipants: number;
  timePerQuestion: number;
  totalQuestions: number;
  
  // Results
  winner?: string;                // User ID of winner
  leaderboard: {
    userId: string;
    score: number;
    rank: number;
    xpEarned: number;
  }[];
  
  // Real-time
  activeConnections: string[];    // Currently connected user IDs
  
  // Metadata
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  createdBy: string;              // User who initiated
}
```

## 🏆 Badges Collection

**Path:** `/badges/{badgeId}`

```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: 'achievement' | 'streak' | 'subject' | 'social' | 'special';
  
  // Earning Criteria
  criteria: {
    type: 'xp_threshold' | 'streak_days' | 'quiz_completion' | 
          'perfect_score' | 'battle_wins' | 'custom';
    value?: number;               // Threshold value
    subject?: string;             // Subject-specific badges
    description: string;          // Human-readable criteria
  };
  
  // Rarity and Value
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpValue: number;                // XP bonus when earned
  
  // Creation
  createdBy: string;              // Teacher ID or 'system' for AI
  generatedByAI: boolean;
  aiPrompt?: string;
  
  // Status
  isActive: boolean;
  isPublic: boolean;              // Available to all classes or specific
  classIds?: string[];            // Specific classes if not public
  
  // Analytics
  timesEarned: number;
  firstEarnedBy?: string;         // First student to earn it
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 📈 Streaks Collection

**Path:** `/streaks/{userId}`

```typescript
interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Timestamp;
  
  // Streak History
  streakHistory: {
    date: string;                 // YYYY-MM-DD format
    activityCompleted: boolean;
    xpEarned: number;
    quizzesCompleted: number;
  }[];
  
  // Streak Rewards
  rewardsEarned: {
    streakDay: number;
    rewardType: 'xp' | 'badge' | 'title';
    rewardValue: string;
    earnedAt: Timestamp;
  }[];
  
  // Settings
  reminderEnabled: boolean;
  reminderTime: string;           // HH:MM format
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🏅 Leaderboards Collection

**Path:** `/leaderboards/{type}/{scopeId}`

Types: `global`, `class`, `school`
ScopeId: `global` | `{classId}` | `{schoolId}`

```typescript
interface Leaderboard {
  id: string;
  type: 'global' | 'class' | 'school';
  scopeId: string;               // 'global', classId, or schoolId
  period: 'all_time' | 'monthly' | 'weekly' | 'daily';
  
  rankings: {
    userId: string;
    displayName: string;
    xp: number;
    level: number;
    streak: number;
    rank: number;
    change: number;              // Rank change from previous period
    badges: number;              // Total badges earned
  }[];
  
  // Metadata
  lastUpdated: Timestamp;
  totalParticipants: number;
}
```

## 🔔 Notifications Collection

**Path:** `/notifications/{userId}/messages/{notificationId}`

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'quiz_assigned' | 'battle_invite' | 'badge_earned' | 
        'streak_milestone' | 'leaderboard_update' | 'custom';
  
  // Content
  title: string;
  message: string;
  iconUrl?: string;
  actionUrl?: string;            // Deep link within app
  
  // Data
  data?: {
    quizId?: string;
    battleId?: string;
    badgeId?: string;
    [key: string]: any;
  };
  
  // Status
  isRead: boolean;
  isArchived: boolean;
  
  // Metadata
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}
```

## 📊 Analytics Collection

**Path:** `/analytics/{classId}/daily/{date}`

```typescript
interface DailyAnalytics {
  classId: string;
  date: string;                  // YYYY-MM-DD
  
  // Engagement Metrics
  activeStudents: number;
  totalQuizAttempts: number;
  avgSessionDuration: number;
  
  // Performance Metrics
  avgScore: number;
  completionRate: number;
  totalXPEarned: number;
  
  // Gamification Metrics
  badgesEarned: number;
  streaksStarted: number;
  battlesCompleted: number;
  
  // Subject Breakdown
  subjectPerformance: {
    subject: string;
    avgScore: number;
    attempts: number;
  }[];
  
  // Top Performers
  topStudents: {
    userId: string;
    xpEarned: number;
    quizzesCompleted: number;
  }[];
  
  // Metadata
  generatedAt: Timestamp;
}
```

## 🔍 Firestore Indexes

### Composite Indexes Needed

```javascript
// Users - for leaderboards
users: [
  ['classIds', 'xp', 'desc'],
  ['role', 'lastActiveAt', 'desc'],
  ['xp', 'desc']
]

// Quizzes - for teacher dashboard
quizzes: [
  ['createdBy', 'createdAt', 'desc'],
  ['assignedTo.classId', 'availableFrom', 'asc'],
  ['subject', 'difficulty', 'createdAt', 'desc']
]

// Battles - for active battles
battles: [
  ['status', 'createdAt', 'desc'],
  ['participants.userId', 'status'],
  ['type', 'status', 'createdAt', 'desc']
]

// Badges - for filtering
badges: [
  ['category', 'rarity', 'createdAt', 'desc'],
  ['classIds', 'isActive'],
  ['createdBy', 'createdAt', 'desc']
]
```

## 🔒 Security Rules Example

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Teachers can access their classes
    match /classes/{classId} {
      allow read, write: if request.auth != null && 
        resource.data.teacherId == request.auth.uid;
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.studentIds;
    }
    
    // Quiz access based on assignment
    match /quizzes/{quizId} {
      allow read: if request.auth != null && (
        resource.data.createdBy == request.auth.uid ||
        request.auth.uid in resource.data.assignedTo.studentIds ||
        isStudentInAssignedClass()
      );
      allow write: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
  }
}
```