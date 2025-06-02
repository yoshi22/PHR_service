import { auth, db } from '../firebase';
import { Auth, User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

/**
 * Gets the authenticated Firebase Auth instance or throws an error
 */
export function getAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized');
  }
  return auth;
}

/**
 * Gets the Firebase Firestore instance or throws an error
 */
export function getFirestore(): Firestore {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }
  return db;
}

/**
 * Gets the current authenticated user or throws an error
 */
export function getCurrentUser(): User {
  const authInstance = getAuth();
  const user = authInstance.currentUser;
  
  // デバッグ用ログ
  console.log('🔍 getCurrentUser Debug:');
  console.log('- Auth instance exists:', !!authInstance);
  console.log('- Current user exists:', !!user);
  if (user) {
    console.log('- User ID:', user.uid);
    console.log('- User email:', user.email);
    console.log('- User verified:', user.emailVerified);
  }
  
  if (!user) {
    throw new Error('No authenticated user found');
  }
  return user;
}

/**
 * Gets the current authenticated user or returns null if not authenticated
 */
export function getCurrentUserSafe(): User | null {
  if (!auth) {
    return null;
  }
  return auth.currentUser;
}

/**
 * Checks if Firebase is properly initialized
 */
export function isFirebaseInitialized(): boolean {
  return !!(auth && db);
}
