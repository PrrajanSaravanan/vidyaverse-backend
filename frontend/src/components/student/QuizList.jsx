import React from 'react'
import { Link } from 'react-router-dom'
import {
  AcademicCapIcon,
  ClockIcon,
  PlayIcon,
  FireIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

const QuizList = ({ dashboardData, onDataUpdate }) => {
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const { pending_quizzes, recent_results } = dashboardData

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Available Quizzes</h1>
        <p className="text-gray-600 mt-1">Test your knowledge and earn XP points</p>
      </div>

      {/* Available Quizzes */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Ready to Take</h2>
        
        {pending_quizzes.length === 0 ? (
          <div className="text-center py-12">
            <AcademicCapIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes available</h3>
            <p className="text-gray-600 mb-6">
              Join more classes or wait for your teacher to create new quizzes
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pending_quizzes.map((quiz) => (
              <div key={quiz.id} className="quiz-card bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {quiz.title}
                  </h3>
                  {quiz.is_battle_enabled && (
                    <span className="badge badge-warning flex items-center">
                      <FireIcon className="h-3 w-3 mr-1" />
                      Battle
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {quiz.description || 'Test your knowledge with this quiz'}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    {quiz.question_count} questions
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    {Math.floor(quiz.time_limit / 60)} minutes
                  </div>
                  <div className="flex items-center text-sm text-primary-600 font-medium">
                    <TrophyIcon className="h-4 w-4 mr-2" />
                    +{quiz.xp_reward} XP reward
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/quiz/${quiz.id}`}
                    className="btn btn-primary flex-1 flex items-center justify-center"
                  >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Start Quiz
                  </Link>
                  
                  {quiz.is_battle_enabled && (
                    <Link
                      to={`/student/battles?quiz=${quiz.id}`}
                      className="btn btn-warning flex items-center"
                    >
                      <FireIcon className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Results */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Quiz Results</h2>
        
        {recent_results.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-3">📊</div>
            <p className="text-gray-500">No quiz results yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete your first quiz to see results here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Quiz</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Score</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">XP Earned</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent_results.map((result) => (
                  <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{result.quiz_title}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`font-medium ${
                        result.score >= 80 ? 'text-green-600' :
                        result.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {result.score}%
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-primary-600 font-medium">
                        +{result.xp_earned} XP
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-500">
                        {new Date(result.completed_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizList