import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  Auth
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
function validateFirebaseConfig() {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => {
    const value = firebaseConfig[field as keyof typeof firebaseConfig];
    return !value || value.trim() === '';
  });
  
  if (missingFields.length > 0) {
    console.error('Firebase configuration:', firebaseConfig);
    throw new Error(`Firebase configuration missing required fields: ${missingFields.join(', ')}`);
  }
}

// Initialize Firebase with retry mechanism
let app: FirebaseApp | undefined;
let initializationAttempts = 0;
const maxAttempts = 3;

async function initializeFirebaseApp() {
  try {
    // Validate configuration before initializing
    validateFirebaseConfig();
    
    // Try to get existing app first
    try {
      app = getApp();
    } catch {
      // No existing app, initialize new one
      app = initializeApp(firebaseConfig);
    }
  } catch (error) {
    console.error('🔥 Firebase initialization error:', error);
    if (initializationAttempts < maxAttempts) {
      initializationAttempts++;
      setTimeout(initializeFirebaseApp, 1000);
    } else {
      console.error('🔥 Firebase initialization failed after multiple attempts');
      throw new Error('Firebase initialization failed after multiple attempts');
    }
  }
}

// Initialize Firebase immediately only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  initializeFirebaseApp();
}

// Initialize Firebase Auth - getAuth() automatically uses AsyncStorage persistence in React Native
let auth: Auth | undefined;
try {
  if (app) {
    auth = getAuth(app);
  }
} catch (error) {
  console.error('⚠️ Firebase Auth initialization error:', error);
  auth = undefined;
}

// Initialize Firestore
const db = app ? getFirestore(app) : null;

// Export initialized instances
export { app, auth, db };

// Export wrapped getAuth for convenience
export const getFirebaseAuth = () => {
  try {
    if (!app) {
      throw new Error('Firebase app not initialized');
    }
    
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    return auth;
  } catch (error) {
    console.error('Firebase Auth error:', error);
    throw new Error('Firebase Authの初期化に失敗しました');
  }
};