import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  onAuthStateChanged,
  Auth
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

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
  
  console.log('Firebase configuration validated successfully');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('Auth Domain:', firebaseConfig.authDomain);
}

// Initialize Firebase with retry mechanism
let app: FirebaseApp | undefined;
let initializationAttempts = 0;
const maxAttempts = 3;

async function initializeFirebaseApp() {
  try {
    console.log('🔥 Starting Firebase initialization...');
    
    // Validate configuration before initializing
    validateFirebaseConfig();
    
    // Try to get existing app first
    try {
      app = getApp();
      console.log('🔥 Using existing Firebase app');
    } catch {
      // No existing app, initialize new one
      console.log('🔥 Initializing new Firebase app...');
      app = initializeApp(firebaseConfig);
      console.log('🔥 Firebase app initialized successfully');
    }
  } catch (error) {
    console.error('🔥 Firebase initialization error:', error);
    if (initializationAttempts < maxAttempts) {
      initializationAttempts++;
      console.log(`🔥 Retrying Firebase initialization (attempt ${initializationAttempts}/${maxAttempts})`);
      setTimeout(initializeFirebaseApp, 1000);
    } else {
      console.error('🔥 Firebase initialization failed after multiple attempts');
      throw new Error('Firebase initialization failed after multiple attempts');
    }
  }
}

// Initialize Firebase immediately
initializeFirebaseApp();

// Initialize Auth with AsyncStorage persistence for React Native
let auth: Auth | undefined;
try {
  if (app) {
    console.log('🔐 Initializing Firebase Auth with AsyncStorage persistence');
    
    // Check if auth already exists before initializing
    try {
      auth = getAuth(app);
      console.log('🔐 Using existing Firebase Auth instance');
    } catch (getAuthError) {
      console.log('🔐 No existing Auth instance, creating new one with persistence');
      // Create a new auth instance with persistence
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    }
  }
} catch (error) {
  console.error('⚠️ Firebase Auth initialization error:', error);
  // Try to get existing auth instance as fallback
  try {
    if (app) {
      auth = getAuth(app);
      console.log('🔐 Using fallback Firebase Auth instance without custom persistence');
    }
  } catch (fallbackError) {
    console.error('❌ Firebase Auth fallback initialization error:', fallbackError);
    // Auth initialization completely failed
    auth = undefined;
  }
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