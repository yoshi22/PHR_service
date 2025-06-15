import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

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

// Initialize Firebase using compat mode (v8 API style)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized using compat mode');
} else {
  console.log('Firebase already initialized');
}

// Export Firebase services using compat mode
export const auth = firebase.auth();
export const db = firebase.firestore();

// Configure Firestore for Asia-Northeast1 region
db.settings({
  host: 'asia-northeast1-firestore.googleapis.com',
  ssl: true
});

// Export wrapped getAuth for convenience
export const getFirebaseAuth = () => {
  return auth;
};