import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import {
  PlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  SparklesIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

// Import teacher components (we'll create these)
import TeacherOverview from '../components/teacher/TeacherOverview'
import ClassManagement from '../components/teacher/ClassManagement'
import QuizManagement from '../components/teacher/QuizManagement'
import StudentProgress from '../components/teacher/StudentProgress'
import BadgeManagement from '../components/teacher/BadgeManagement'

const TeacherDashboard = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalQuizzes: 0,
    avgClassScore: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const [classesRes, quizzesRes] = await Promise.all([
        axios.get('/teacher/classes'),
        axios.get('/teacher/quizzes')
      ])

      const classes = classesRes.data.classes || []
      const quizzes = quizzesRes.data.quizzes || []

      const totalStudents = classes.reduce((sum, cls) => sum + cls.student_count, 0)
      const avgScore = quizzes.reduce((sum, quiz) => sum + quiz.average_score, 0) / quizzes.length || 0

      setStats({
        totalClasses: classes.length,
        totalStudents,
        totalQuizzes: quizzes.length,
        avgClassScore: Math.round(avgScore)
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      toast.error('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const isActive = (path) => {
    if (path === '/teacher') {
      return location.pathname === '/teacher'
    }
    return location.pathname.startsWith(path)
  }

  const sidebarItems = [
    { name: 'Overview', path: '/teacher', icon: ChartBarIcon },
    { name: 'Classes', path: '/teacher/classes', icon: UserGroupIcon },
    { name: 'Quizzes', path: '/teacher/quizzes', icon: AcademicCapIcon },
    { name: 'Student Progress', path: '/teacher/progress', icon: ChartBarIcon },
    { name: 'Badge Management', path: '/teacher/badges', icon: TrophyIcon },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Teacher Dashboard
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

          {/* Quick stats in sidebar */}
          <div className="p-6 mt-8 border-t">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Classes</span>
                <span className="font-medium">{stats.totalClasses}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Students</span>
                <span className="font-medium">{stats.totalStudents}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quizzes</span>
                <span className="font-medium">{stats.totalQuizzes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Score</span>
                <span className="font-medium">{stats.avgClassScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          <Routes>
            <Route 
              index 
              element={<TeacherOverview stats={stats} onStatsUpdate={fetchDashboardStats} />} 
            />
            <Route 
              path="classes/*" 
              element={<ClassManagement onStatsUpdate={fetchDashboardStats} />} 
            />
            <Route 
              path="quizzes/*" 
              element={<QuizManagement onStatsUpdate={fetchDashboardStats} />} 
            />
            <Route 
              path="progress/*" 
              element={<StudentProgress />} 
            />
            <Route 
              path="badges/*" 
              element={<BadgeManagement />} 
            />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard