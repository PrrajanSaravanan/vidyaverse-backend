import React, { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'
import {
  PlusIcon,
  UserGroupIcon,
  ClipboardDocumentIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const ClassList = ({ onStatsUpdate }) => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/teacher/classes')
      setClasses(response.data.classes || [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
      toast.error('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const copyClassCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Class code copied to clipboard!')
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
          <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600 mt-1">Manage your classes and students</p>
        </div>
        <Link
          to="/teacher/classes/new"
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Class
        </Link>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
          <p className="text-gray-600 mb-6">Create your first class to get started</p>
          <Link
            to="/teacher/classes/new"
            className="btn btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Your First Class
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                <Link
                  to={`/teacher/classes/${cls.id}`}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <EyeIcon className="h-4 w-4" />
                </Link>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                {cls.description || 'No description provided'}
              </p>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Students</span>
                  <span className="font-medium">{cls.student_count}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Class Code</span>
                  <button
                    onClick={() => copyClassCode(cls.code)}
                    className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                  >
                    <span className="font-mono font-medium">{cls.code}</span>
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Link
                  to={`/teacher/class/${cls.id}/leaderboard`}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View Leaderboard →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const CreateClass = ({ onStatsUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Class name is required')
      return
    }

    setLoading(true)

    try {
      await axios.post('/teacher/class/create', formData)
      toast.success('Class created successfully!')
      onStatsUpdate?.()
      // Navigate back to class list
      window.history.back()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create class')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Class</h1>
        <p className="text-gray-600 mt-1">Set up a new class for your students</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Class Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="input"
            placeholder="e.g., Mathematics 101"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="input"
            placeholder="Describe what this class is about..."
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <div className="loading-spinner w-5 h-5"></div>
            ) : (
              'Create Class'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

const ClassManagement = ({ onStatsUpdate }) => {
  return (
    <Routes>
      <Route index element={<ClassList onStatsUpdate={onStatsUpdate} />} />
      <Route path="new" element={<CreateClass onStatsUpdate={onStatsUpdate} />} />
    </Routes>
  )
}

export default ClassManagement