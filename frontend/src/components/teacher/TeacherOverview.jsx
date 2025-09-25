import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  PlusIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  TrophyIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const TeacherOverview = ({ stats, onStatsUpdate }) => {
  const [recentActivity, setRecentActivity] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [insights, setInsights] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState('')
  const [classes, setClasses] = useState([])

  useEffect(() => {
    fetchOverviewData()
  }, [])

  const fetchOverviewData = async () => {
    try {
      setLoading(true)
      const [classesRes, activityRes] = await Promise.all([
        axios.get('/teacher/classes'),
        axios.get('/teacher/quizzes')
      ])

      const classesData = classesRes.data.classes || []
      setClasses(classesData)

      // Mock recent activity - in real app, this would come from an API
      const mockActivity = [
        { type: 'quiz_completed', student: 'Alice Johnson', quiz: 'Math Quiz 1', score: 95, time: '2 hours ago' },
        { type: 'student_joined', student: 'Bob Smith', class: 'Chemistry 101', time: '3 hours ago' },
        { type: 'quiz_completed', student: 'Carol White', quiz: 'Physics Quiz', score: 87, time: '5 hours ago' },
        { type: 'badge_earned', student: 'David Brown', badge: 'Quick Learner', time: '1 day ago' },
      ]
      setRecentActivity(mockActivity)

      // Mock top performers
      const mockTopPerformers = [
        { name: 'Alice Johnson', score: 95, xp: 1250, badges: 8 },
        { name: 'Carol White', score: 89, xp: 1150, badges: 6 },
        { name: 'Bob Smith', score: 85, xp: 980, badges: 5 },
        { name: 'David Brown', score: 82, xp: 890, badges: 7 },
      ]
      setTopPerformers(mockTopPerformers)

    } catch (error) {
      console.error('Failed to fetch overview data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInsights = async (classId) => {
    if (!classId) return
    
    try {
      const response = await axios.get(`/teacher/ai-insights/${classId}`)
      setInsights(response.data.insights)
    } catch (error) {
      console.error('Failed to fetch AI insights:', error)
    }
  }

  const handleClassChange = (e) => {
    const classId = e.target.value
    setSelectedClass(classId)
    if (classId) {
      fetchInsights(classId)
    } else {
      setInsights('')
    }
  }

  const statCards = [
    {
      title: 'Total Classes',
      value: stats.totalClasses,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      link: '/teacher/classes'
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: UserGroupIcon,
      color: 'bg-green-500',
      link: '/teacher/progress'
    },
    {
      title: 'Total Quizzes',
      value: stats.totalQuizzes,
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      link: '/teacher/quizzes'
    },
    {
      title: 'Average Score',
      value: `${stats.avgClassScore}%`,
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
      link: '/teacher/progress'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-600 mt-1">Monitor your classes and student progress</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/teacher/classes/new"
            className="btn btn-secondary flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Class
          </Link>
          <Link
            to="/teacher/quizzes/new"
            className="btn btn-primary flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Quiz
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link 
              key={index}
              to={stat.link}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <Link to="/teacher/progress" className="text-primary-600 hover:text-primary-700 text-sm">
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'quiz_completed' ? 'bg-green-500' :
                  activity.type === 'student_joined' ? 'bg-blue-500' :
                  activity.type === 'badge_earned' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.student}
                    {activity.type === 'quiz_completed' && (
                      <span> completed {activity.quiz} with {activity.score}%</span>
                    )}
                    {activity.type === 'student_joined' && (
                      <span> joined {activity.class}</span>
                    )}
                    {activity.type === 'badge_earned' && (
                      <span> earned {activity.badge} badge</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Top Performers</h2>
            <Link to="/leaderboard" className="text-primary-600 hover:text-primary-700 text-sm">
              View Leaderboard
            </Link>
          </div>
          
          <div className="space-y-4">
            {topPerformers.map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-yellow-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">
                      Avg: {student.score}% • {student.xp} XP
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TrophyIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{student.badges}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
          <select
            value={selectedClass}
            onChange={handleClassChange}
            className="input w-48"
          >
            <option value="">Select a class for insights</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
        
        {insights ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="prose prose-blue max-w-none">
              <p className="text-blue-800 whitespace-pre-line">{insights}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Select a class to view AI-powered insights about student performance</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherOverview