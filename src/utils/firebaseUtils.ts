import { auth, db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

type Auth = firebase.auth.Auth;
type User = firebase.User;
type Firestore = firebase.firestore.Firestore;

/**
 * Gets the Firebase Auth instance or throws an error if not initialized.
 * @returns Firebase Auth instance
 * @throws Error if Firebase Auth is not initialized
 */
export function getAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized');
  }
  return auth;
}

/**
 * Gets the Firebase Firestore instance or throws an error if not initialized.
 * @returns Firebase Firestore instance
 * @throws Error if Firebase Firestore is not initialized
 */
export function getFirestore(): Firestore {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }
  return db;
}

/**
 * Gets the current authenticated user or throws an error if not authenticated.
 * @returns Current authenticated user
 * @throws Error if no user is authenticated
 */
export function getCurrentUser(): User {
  const authInstance = getAuth();
  const user = authInstance.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user found');
  }
  return user;
}

/**
 * Gets the current authenticated user or returns null if not authenticated.
 * @returns Current user or null if not authenticated
 */
export function getCurrentUserSafe(): User | null {
  if (!auth) {
    return null;
  }
  return auth.currentUser;
}

/**
 * Checks if Firebase services are properly initialized.
 * @returns True if both Auth and Firestore are initialized
 */
export function isFirebaseInitialized(): boolean {
  return !!(auth && db);
}
