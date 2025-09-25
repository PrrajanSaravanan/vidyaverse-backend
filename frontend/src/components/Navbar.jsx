import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  HomeIcon,
  UserGroupIcon,
  TrophyIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon,
  FireIcon
} from '@heroicons/react/24/outline'

const Navbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  if (!user) return null

  const teacherNavItems = [
    { name: 'Dashboard', href: '/teacher', icon: HomeIcon },
    { name: 'Classes', href: '/teacher/classes', icon: UserGroupIcon },
    { name: 'Quizzes', href: '/teacher/quizzes', icon: AcademicCapIcon },
    { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
  ]

  const studentNavItems = [
    { name: 'Dashboard', href: '/student', icon: HomeIcon },
    { name: 'Quizzes', href: '/student/quizzes', icon: AcademicCapIcon },
    { name: 'Battles', href: '/student/battles', icon: FireIcon },
    { name: 'Badges', href: '/student/badges', icon: TrophyIcon },
    { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
  ]

  const navItems = user.role === 'teacher' ? teacherNavItems : studentNavItems

  const isActive = (href) => {
    if (href === '/teacher' || href === '/student') {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                Learning Hub
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {user.role}
                  {user.role === 'student' && (
                    <>
                      {' • '}
                      <span className="text-primary-600">
                        Level {Math.floor(user.xp / 100) + 1}
                      </span>
                      {' • '}
                      <span className="text-warning-600">
                        {user.xp} XP
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Link
                to="/profile"
                className={`p-2 rounded-full transition-colors ${
                  location.pathname === '/profile'
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <UserIcon className="h-5 w-5" />
              </Link>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            {/* Mobile user info */}
            <div className="px-3 py-2 border-t border-gray-200 mt-4">
              <div className="text-base font-medium text-gray-900">
                {user.name}
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {user.role}
                {user.role === 'student' && (
                  <>
                    {' • '}
                    <span className="text-primary-600">
                      Level {Math.floor(user.xp / 100) + 1}
                    </span>
                    {' • '}
                    <span className="text-warning-600">
                      {user.xp} XP
                    </span>
                  </>
                )}
              </div>
            </div>

            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                location.pathname === '/profile'
                  ? 'text-primary-600 bg-primary-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <UserIcon className="h-5 w-5" />
              <span>Profile</span>
            </Link>

            <button
              onClick={() => {
                logout()
                setIsMobileMenuOpen(false)
              }}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-full text-left transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar