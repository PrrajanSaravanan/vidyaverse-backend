import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  PlusIcon,
  SparklesIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const QuizList = ({ onStatsUpdate }) => {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get('/teacher/quizzes')
      setQuizzes(response.data.quizzes || [])
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
      toast.error('Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  const deleteQuiz = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return

    try {
      await axios.delete(`/teacher/quiz/${quizId}`)
      toast.success('Quiz deleted successfully')
      fetchQuizzes()
      onStatsUpdate?.()
    } catch (error) {
      toast.error('Failed to delete quiz')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
          <p className="text-gray-600 mt-1">Create and manage your quizzes</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/teacher/quizzes/ai-generate"
            className="btn btn-secondary flex items-center"
          >
            <SparklesIcon className="h-4 w-4 mr-2" />
            AI Generate
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

      {/* Quiz Grid */}
      {quizzes.length === 0 ? (
        <div className="text-center py-12">
          <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
          <p className="text-gray-600 mb-6">Create your first quiz to get started</p>
          <Link
            to="/teacher/quizzes/new"
            className="btn btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Your First Quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {quiz.title}
                </h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}`)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}/edit`)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteQuiz(quiz.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {quiz.description || 'No description provided'}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  {quiz.question_count} questions
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  {Math.floor(quiz.time_limit / 60)} minutes
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  {quiz.attempts} attempts
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className={`badge ${quiz.is_battle_enabled ? 'badge-warning' : 'badge-primary'}`}>
                    {quiz.is_battle_enabled ? 'Battle Enabled' : 'Standard Quiz'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Avg: {quiz.average_score?.toFixed(1) || 0}%
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Link
                  to={`/teacher/quizzes/${quiz.id}/results`}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View Results →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const CreateQuiz = ({ onStatsUpdate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    time_limit: 300,
    xp_reward: 50,
    is_battle_enabled: false
  })
  const [questions, setQuestions] = useState([{
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0
  }])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/teacher/classes')
      setClasses(response.data.classes || [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions]
    if (field === 'options') {
      updatedQuestions[index].options = value
    } else {
      updatedQuestions[index][field] = value
    }
    setQuestions(updatedQuestions)
  }

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options[optionIndex] = value
    setQuestions(updatedQuestions)
  }

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0
    }])
  }

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Quiz title is required')
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} is required`)
        return
      }
      if (q.options.some(opt => !opt.trim())) {
        toast.error(`All options for question ${i + 1} are required`)
        return
      }
    }

    setLoading(true)

    try {
      const quizData = {
        ...formData,
        questions
      }

      await axios.post('/teacher/quiz/create', quizData)
      toast.success('Quiz created successfully!')
      onStatsUpdate?.()
      navigate('/teacher/quizzes')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Quiz</h1>
          <p className="text-gray-600 mt-1">Design a new quiz for your students</p>
        </div>
        <Link
          to="/teacher/quizzes"
          className="btn btn-secondary"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Quiz Details */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quiz Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className="input"
                placeholder="Enter quiz title"
                value={formData.title}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label htmlFor="class_id" className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Class
              </label>
              <select
                id="class_id"
                name="class_id"
                className="input"
                value={formData.class_id}
                onChange={handleFormChange}
              >
                <option value="">Select a class (optional)</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="time_limit" className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (seconds)
              </label>
              <input
                id="time_limit"
                name="time_limit"
                type="number"
                min="60"
                className="input"
                value={formData.time_limit}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label htmlFor="xp_reward" className="block text-sm font-medium text-gray-700 mb-2">
                XP Reward
              </label>
              <input
                id="xp_reward"
                name="xp_reward"
                type="number"
                min="1"
                className="input"
                value={formData.xp_reward}
                onChange={handleFormChange}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="input"
                placeholder="Enter quiz description"
                value={formData.description}
                onChange={handleFormChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_battle_enabled"
                  checked={formData.is_battle_enabled}
                  onChange={handleFormChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable quiz battles (allows students to compete in real-time)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="btn btn-secondary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Question
            </button>
          </div>

          <div className="space-y-8">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Question {qIndex + 1}
                  </h3>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      rows={2}
                      className="input"
                      placeholder="Enter your question"
                      value={question.question}
                      onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer Options *
                    </label>
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name={`correct_answer_${qIndex}`}
                            checked={question.correct_answer === oIndex}
                            onChange={() => handleQuestionChange(qIndex, 'correct_answer', oIndex)}
                            className="text-primary-600 focus:ring-primary-500"
                          />
                          <input
                            type="text"
                            className="input flex-1"
                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                            value={option}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Select the radio button next to the correct answer
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Link
            to="/teacher/quizzes"
            className="btn btn-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <div className="loading-spinner w-5 h-5"></div>
            ) : (
              'Create Quiz'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

const QuizManagement = ({ onStatsUpdate }) => {
  return (
    <Routes>
      <Route index element={<QuizList onStatsUpdate={onStatsUpdate} />} />
      <Route path="new" element={<CreateQuiz onStatsUpdate={onStatsUpdate} />} />
      {/* Add more routes as needed */}
    </Routes>
  )
}

export default QuizManagement