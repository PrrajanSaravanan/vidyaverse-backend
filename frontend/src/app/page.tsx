'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import StudentDashboard from '@/components/student/StudentDashboard';

export default function HomePage() {
  const { user, userProfile, loading, isAuthenticated, isStudent, isTeacher } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null; // Will redirect to login
  }

  // Render appropriate dashboard based on user role
  if (isStudent()) {
    return <StudentDashboard />;
  }

  if (isTeacher()) {
    // TODO: Implement TeacherDashboard
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Teacher Dashboard</h1>
          <p className="text-gray-600">Coming soon! Teacher dashboard is under development.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Learn Quest!</h1>
        <p className="text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
}