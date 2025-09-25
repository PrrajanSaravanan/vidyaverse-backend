import React from 'react'
import { Link } from 'react-router-dom'
import {
  AcademicCapIcon,
  FireIcon,
  TrophyIcon,
  ClockIcon,
  ChartBarIcon,
  PlayIcon
} from '@heroicons/react/24/outline'

const StudentOverview = ({ dashboardData, onDataUpdate }) => {
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const { student, pending_quizzes, recent_results, badges, enrolled_classes, streak } = dashboardData

  const quickStats = [
    {
      title: 'XP Points',
      value: student.xp,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      change: '+25 this week'
    },
    {
      title: 'Current Level',
      value: Math.floor(student.xp / 100) + 1,
      icon: TrophyIcon,
      color: 'bg-blue-500',
      change: `${student.xp % 100} XP to next level`
    },
    {
      title: 'Active Streak',
      value: `${streak} days`,
      icon: FireIcon,
      color: 'bg-orange-500',
      change: streak > 0 ? 'Keep it up!' : 'Start your streak!'
    },
    {
      title: 'Badges Earned',
      value: badges.length,
      icon: TrophyIcon,
      color: 'bg-yellow-500',
      change: 'View collection'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {student.name}!</h1>
        <p className="text-primary-100 mb-4">
          Ready to continue your learning journey?
        </p>
        <div className="flex justify-center items-center space-x-6 text-sm">
          <div>
            <span className="block text-2xl font-bold">{student.xp}</span>
            <span className="text-primary-200">Total XP</span>
          </div>
          <div>
            <span className="block text-2xl font-bold">{Math.floor(student.xp / 100) + 1}</span>
            <span className="text-primary-200">Level</span>
          </div>
          <div>
            <span className="block text-2xl font-bold">{streak}</span>
            <span className="text-primary-200">Day Streak</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Quizzes */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Available Quizzes</h2>
            <Link to="/student/quizzes" className="text-primary-600 hover:text-primary-700 text-sm">
              View All
            </Link>
          </div>
          
          {pending_quizzes.length === 0 ? (
            <div className="text-center py-8">
              <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No quizzes available right now</p>
              <p className="text-sm text-gray-400 mt-1">Check back later or join more classes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending_quizzes.slice(0, 3).map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center">
                        <AcademicCapIcon className="h-4 w-4 mr-1" />
                        {quiz.question_count} questions
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {Math.floor(quiz.time_limit / 60)} min
                      </span>
                      <span className="text-primary-600 font-medium">
                        +{quiz.xp_reward} XP
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/quiz/${quiz.id}`}
                    className="btn btn-primary btn-sm flex items-center"
                  >
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Start
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Results</h2>
            <Link to="/student/progress" className="text-primary-600 hover:text-primary-700 text-sm">
              View Progress
            </Link>
          </div>
          
          {recent_results.length === 0 ? (
            <div className="text-center py-8">
              <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No quiz results yet</p>
              <p className="text-sm text-gray-400 mt-1">Complete your first quiz to see results</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recent_results.slice(0, 4).map((result) => (
                <div key={result.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{result.quiz_title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(result.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      result.score >= 80 ? 'text-green-600' :
                      result.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {result.score}%
                    </div>
                    <div className="text-sm text-primary-600">
                      +{result.xp_earned} XP
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Classes and Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enrolled Classes */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Classes</h2>
          
          {enrolled_classes.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Enter class code"
                  className="input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      // Handle join class
                      console.log('Join class with code:', e.target.value)
                    }
                  }}
                />
              </div>
              <p className="text-gray-500">Join your first class</p>
              <p className="text-sm text-gray-400 mt-1">Ask your teacher for a class code</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrolled_classes.map((cls) => (
                <div key={cls.id} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cls.description}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Teacher: {cls.teacher_name} • {cls.student_count} students
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Badges */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Badges</h2>
            <Link to="/student/badges" className="text-primary-600 hover:text-primary-700 text-sm">
              View All
            </Link>
          </div>
          
          {badges.length === 0 ? (
            <div className="text-center py-8">
              <TrophyIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No badges earned yet</p>
              <p className="text-sm text-gray-400 mt-1">Complete quizzes to earn your first badge</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {badges.slice(0, 4).map((badge) => (
                <div key={badge.id} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrophyIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">{badge.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{badge.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentOverview