'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AcademicCapIcon, 
  FireIcon, 
  TrophyIcon, 
  BoltIcon,
  UserGroupIcon,
  PlayIcon 
} from '@heroicons/react/24/solid';
import { useAuthStore } from '@/store/authStore';
import XPBar from '@/components/ui/XPBar';
import BadgeCard from '@/components/ui/BadgeCard';
import Button from '@/components/ui/Button';

interface QuizAssignment {
  id: string;
  title: string;
  subject: string;
  dueDate: Date;
  questions: number;
  estimatedTime: number;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface BattleRoom {
  id: string;
  title: string;
  subject: string;
  playersWaiting: number;
  maxPlayers: number;
  xpPrize: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  rank: number;
}

export default function StudentDashboard() {
  const { userProfile } = useAuthStore();
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [battles, setBattles] = useState<BattleRoom[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    setTimeout(() => {
      setAssignments([
        {
          id: '1',
          title: 'Quadratic Functions',
          subject: 'Mathematics',
          dueDate: new Date(Date.now() + 86400000), // Tomorrow
          questions: 10,
          estimatedTime: 15,
          xpReward: 50,
          difficulty: 'medium'
        },
        {
          id: '2',
          title: 'Cell Biology Review',
          subject: 'Science',
          dueDate: new Date(Date.now() + 172800000), // Day after tomorrow
          questions: 15,
          estimatedTime: 20,
          xpReward: 75,
          difficulty: 'hard'
        }
      ]);

      setBattles([
        {
          id: '1',
          title: 'Science Showdown',
          subject: 'Biology',
          playersWaiting: 4,
          maxPlayers: 8,
          xpPrize: 100,
          difficulty: 'medium'
        },
        {
          id: '2',
          title: 'Math Speed Run',
          subject: 'Algebra',
          playersWaiting: 2,
          maxPlayers: 4,
          xpPrize: 150,
          difficulty: 'hard'
        }
      ]);

      setLeaderboard([
        {
          userId: 'current',
          displayName: userProfile?.displayName || 'You',
          xp: userProfile?.xp || 2847,
          level: userProfile?.level || 12,
          streak: userProfile?.currentStreak || 15,
          rank: 1
        },
        {
          userId: '2',
          displayName: 'Alex K.',
          xp: 2756,
          level: 12,
          streak: 12,
          rank: 2
        },
        {
          userId: '3',
          displayName: 'Emma R.',
          xp: 2689,
          level: 11,
          streak: 8,
          rank: 3
        }
      ]);

      setLoading(false);
    }, 1000);
  }, [userProfile]);

  const difficultyColors = {
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {userProfile?.displayName}! 🌟
              </h1>
              <p className="text-gray-600 mt-1">Ready to continue your learning journey?</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Current Streak</div>
                <div className="flex items-center text-fire-500 font-bold">
                  <FireIcon className="w-5 h-5 mr-1" />
                  {userProfile?.currentStreak || 0} days
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Level {userProfile?.level || 1}</span>
                <span className="text-sm text-gray-500">
                  {userProfile?.xp || 0} XP
                </span>
              </div>
              <XPBar 
                currentXP={userProfile?.xp || 0} 
                level={userProfile?.level || 1} 
              />
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {userProfile?.xp || 0}
              </div>
              <div className="text-sm text-gray-500">Total XP</div>
              <div className="text-xs text-green-600 mt-1">
                Next: {((userProfile?.level || 1) * 100) - (userProfile?.xp || 0)} XP
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center text-3xl font-bold text-fire-500">
                <FireIcon className="w-8 h-8 mr-2" />
                {userProfile?.currentStreak || 0}
              </div>
              <div className="text-sm text-gray-500">Day Streak</div>
              <div className="text-xs text-fire-600 mt-1">
                Keep it going! 🔥
              </div>
            </div>
          </div>
        </motion.div>

        {/* Today's Learning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 Today's Learning</h2>
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <AcademicCapIcon className="w-5 h-5 text-primary-600" />
                      <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[assignment.difficulty]}`}>
                        {assignment.difficulty}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📖 {assignment.subject}</p>
                      <p>⏰ Due: {assignment.dueDate.toLocaleDateString()} • {assignment.questions} questions • ~{assignment.estimatedTime} min</p>
                      <p className="text-warning-600 font-medium">🏆 XP Reward: {assignment.xpReward} points + bonus for speed! ⚡</p>
                    </div>
                  </div>
                  <Button variant="primary" className="ml-4">
                    Take Quiz
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Battle Arena */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⚔️ Battle Arena</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {battles.map((battle) => (
              <div
                key={battle.id}
                className="border border-red-200 rounded-lg p-4 bg-gradient-to-r from-red-50 to-orange-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <BoltIcon className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-gray-900">{battle.title}</h3>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📖 {battle.subject}</p>
                      <p>👥 {battle.playersWaiting}/{battle.maxPlayers} players waiting</p>
                      <p className="text-warning-600 font-medium">🏆 Prize: {battle.xpPrize} XP + exclusive badge</p>
                    </div>
                  </div>
                  <Button variant="danger" size="sm" className="ml-4">
                    <PlayIcon className="w-4 h-4" />
                    Join Battle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">🏆 Recent Achievements</h2>
              <Button variant="ghost" size="sm">View All Badges</Button>
            </div>
            <div className="flex space-x-2 mb-4">
              <BadgeCard
                name="Streak Master"
                description="15-day learning streak"
                icon="🔥"
                rarity="legendary"
                earned
                earnedAt={new Date()}
                xpValue={150}
                size="md"
              />
              <BadgeCard
                name="Math Wizard"
                description="Perfect math quiz scores"
                icon="🧮"
                rarity="epic"
                earned
                earnedAt={new Date(Date.now() - 86400000)}
                xpValue={100}
                size="md"
              />
              <BadgeCard
                name="Speed Demon"
                description="Lightning fast answers"
                icon="⚡"
                rarity="rare"
                earned
                earnedAt={new Date(Date.now() - 172800000)}
                xpValue={75}
                size="md"
              />
            </div>
            <p className="text-sm text-gray-600 italic">
              "You're on fire! 15 days of consistent learning! 🔥"
            </p>
          </motion.div>

          {/* Class Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">👥 Class Leaderboard (Algebra I)</h2>
              <Button variant="ghost" size="sm">View Full Board</Button>
            </div>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.userId === 'current' 
                      ? 'bg-primary-50 border border-primary-200' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 font-bold">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : entry.rank}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {entry.displayName} {entry.userId === 'current' && '(You!)'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Level {entry.level}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{entry.xp.toLocaleString()} XP</div>
                    <div className="flex items-center text-sm text-fire-500">
                      <FireIcon className="w-4 h-4 mr-1" />
                      {entry.streak}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI Study Assistant */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-blue-200"
        >
          <div className="flex items-start space-x-4">
            <div className="text-4xl">🤖</div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">AI Study Assistant</h2>
              <p className="text-gray-600 mb-4">
                "Need help with today's math problems? I can create practice questions just for you!"
              </p>
              <Button variant="primary">
                Ask Question
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}