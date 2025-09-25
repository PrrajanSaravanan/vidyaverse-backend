import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import {
  AcademicCapIcon,
  FireIcon,
  TrophyIcon,
  ChartBarIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

// Import student components (we'll create these)
import StudentOverview from '../components/student/StudentOverview'
import QuizList from '../components/student/QuizList'
import BattleArena from '../components/student/BattleArena'
import BadgeShowcase from '../components/student/BadgeShowcase'
import ProgressTracker from '../components/student/ProgressTracker'
import AIAssistant from '../components/student/AIAssistant'

const StudentDashboard = () => {
  const { user, refreshUser } = useAuth()
  const location = useLocation()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/student/dashboard')
      setDashboardData(response.data.dashboard)
      
      // Refresh user data to get updated XP and level
      refreshUser()
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const isActive = (path) => {
    if (path === '/student') {
      return location.pathname === '/student'
    }
    return location.pathname.startsWith(path)
  }

  const sidebarItems = [
    { name: 'Overview', path: '/student', icon: ChartBarIcon },
    { name: 'Quizzes', path: '/student/quizzes', icon: AcademicCapIcon },
    { name: 'Battles', path: '/student/battles', icon: FireIcon },
    { name: 'Badges', path: '/student/badges', icon: TrophyIcon },
    { name: 'Progress', path: '/student/progress', icon: ChartBarIcon },
    { name: 'AI Assistant', path: '/student/assistant', icon: ChatBubbleLeftRightIcon },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const currentLevel = Math.floor(user.xp / 100) + 1
  const xpForNextLevel = currentLevel * 100
  const xpProgress = user.xp - ((currentLevel - 1) * 100)
  const xpNeeded = xpForNextLevel - user.xp

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Student Dashboard
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {user.name}!
            </p>
          </div>

          <nav className="mt-6">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Student stats in sidebar */}
          <div className="p-6 mt-8 border-t">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Your Stats</h3>
            
            {/* Level Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Level {currentLevel}</span>
                <span className="text-primary-600 font-medium">{user.xp} XP</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="level-progress h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(xpProgress / 100) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {xpNeeded} XP to Level {currentLevel + 1}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Streak</span>
                <span className="font-medium flex items-center">
                  <FireIcon className="h-4 w-4 text-orange-500 mr-1" />
                  {user.streak} days
                </span>
              </div>
              
              {dashboardData && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Badges Earned</span>
                    <span className="font-medium">{dashboardData.badges.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quizzes Completed</span>
                    <span className="font-medium">{dashboardData.recent_results.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Classes Joined</span>
                    <span className="font-medium">{dashboardData.enrolled_classes.length}</span>
                  </div>
                </>
              )}
            </div>

            {/* Quick action */}
            {dashboardData && dashboardData.pending_quizzes.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Link
                  to="/student/quizzes"
                  className="block w-full text-center px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Take Quiz ({dashboardData.pending_quizzes.length} available)
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          <Routes>
            <Route 
              index 
              element={
                <StudentOverview 
                  dashboardData={dashboardData} 
                  onDataUpdate={fetchDashboardData} 
                />
              } 
            />
            <Route 
              path="quizzes/*" 
              element={
                <QuizList 
                  dashboardData={dashboardData}
                  onDataUpdate={fetchDashboardData}
                />
              } 
            />
            <Route 
              path="battles/*" 
              element={
                <BattleArena 
                  onDataUpdate={fetchDashboardData}
                />
              } 
            />
            <Route 
              path="badges/*" 
              element={
                <BadgeShowcase 
                  badges={dashboardData?.badges || []}
                />
              } 
            />
            <Route 
              path="progress/*" 
              element={<ProgressTracker />} 
            />
            <Route 
              path="assistant/*" 
              element={<AIAssistant />} 
            />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard