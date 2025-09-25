import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'teacher' | 'student';
  profileImageUrl?: string;
  xp?: number;
  level?: number;
  currentStreak?: number;
  longestStreak?: number;
  badges?: string[];
  classIds?: string[];
  teachingClasses?: string[];
  createdAt: any;
  lastActiveAt: any;
  preferences: {
    notifications: boolean;
    soundEffects: boolean;
    theme: 'light' | 'dark';
  };
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string,
  role: 'teacher' | 'student'
) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create user profile in Firestore
  const userProfile: Partial<UserProfile> = {
    uid: user.uid,
    email: user.email!,
    displayName,
    role,
    xp: role === 'student' ? 0 : undefined,
    level: role === 'student' ? 1 : undefined,
    currentStreak: role === 'student' ? 0 : undefined,
    longestStreak: role === 'student' ? 0 : undefined,
    badges: role === 'student' ? [] : undefined,
    classIds: role === 'student' ? [] : undefined,
    teachingClasses: role === 'teacher' ? [] : undefined,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    preferences: {
      notifications: true,
      soundEffects: true,
      theme: 'light',
    },
  };

  await setDoc(doc(db, 'users', user.uid), userProfile);
  return user;
};

export const signOutUser = () => signOut(auth);

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    await setDoc(doc(db, 'users', uid), { 
      ...updates, 
      lastActiveAt: new Date() 
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};