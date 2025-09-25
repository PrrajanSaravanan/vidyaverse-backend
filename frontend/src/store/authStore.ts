import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile } from '@/lib/auth';

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  isAuthenticated: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setLoading: (loading) => set({ loading }),
  
  isAuthenticated: () => {
    const { user } = get();
    return !!user;
  },
  
  isTeacher: () => {
    const { userProfile } = get();
    return userProfile?.role === 'teacher';
  },
  
  isStudent: () => {
    const { userProfile } = get();
    return userProfile?.role === 'student';
  },
}));