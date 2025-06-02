// Simple standalone Firebase test script for Node.js environment
// This can be run directly with Node.js without any React Native dependencies
const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  signInWithEmailAndPassword, 
  setPersistence,
  browserLocalPersistence
} = require('firebase/auth');
const { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  query,
  where,
  getDocs
} = require('firebase/firestore');

// This reads the environment variables directly from the .env.local file
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase with environment variables
function initializeFirebase() {
  // Log which environment variables are available
  console.log('Environment variables check:');
  const firebaseEnvVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
    'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'
  ];

  firebaseEnvVars.forEach(key => {
    console.log(`${key}: ${process.env[key] ? '✓ Available' : '✗ Missing'}`);
  });

  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, 
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  return { app, auth, db };
}

async function testAuthentication(auth, email, password) {
  console.log(`\n🧪 Testing Authentication with email: ${email}`);
  try {
    // Set persistence to local (similar to AsyncStorage in React Native)
    await setPersistence(auth, browserLocalPersistence);
    
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Authentication successful:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });
    
    return user;
  } catch (error) {
    console.error('❌ Authentication failed:', {
      code: error.code,
      message: error.message
    });
    throw error;
  }
}

async function testFirestoreAccess(db, user) {
  console.log(`\n🧪 Testing Firestore access for user: ${user.uid}`);
  
  try {
    // Test 1: Get user profile document
    const userProfileRef = doc(db, 'userProfile', user.uid);
    const userProfileSnap = await getDoc(userProfileRef);
    
    if (userProfileSnap.exists()) {
      console.log('✅ Successfully read user profile:', userProfileSnap.data());
    } else {
      console.log('⚠️ User profile document does not exist - this may be normal for new users');
    }
    
    // Test 2: Get user settings document
    const userSettingsRef = doc(db, 'userSettings', user.uid);
    const userSettingsSnap = await getDoc(userSettingsRef);
    
    if (userSettingsSnap.exists()) {
      console.log('✅ Successfully read user settings:', userSettingsSnap.data());
    } else {
      console.log('⚠️ User settings document does not exist - this may be normal for new users');
    }
    
    // Test 3: Query step data collection
    const stepDataRef = collection(db, 'stepData');
    const stepDataQuery = query(stepDataRef, where('userId', '==', user.uid));
    const stepDataSnap = await getDocs(stepDataQuery);
    
    console.log(`✅ Successfully queried stepData collection - found ${stepDataSnap.size} documents`);
    
    return {
      userProfile: userProfileSnap.exists() ? userProfileSnap.data() : null,
      userSettings: userSettingsSnap.exists() ? userSettingsSnap.data() : null,
      stepDataCount: stepDataSnap.size
    };
  } catch (error) {
    console.error('❌ Firestore access failed:', {
      code: error.code,
      message: error.message
    });
    throw error;
  }
}

// Main test function
async function runFirebaseTests() {
  console.log('🔍 Starting Firebase Connection Tests');
  try {
    // Initialize Firebase
    const { app, auth, db } = initializeFirebase();
    console.log(`✅ Firebase initialized with project: ${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}`);
    
    // Test 1: Authentication
    const testUser = {
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'password123'
    };
    
    const user = await testAuthentication(auth, testUser.email, testUser.password);
    
    // Test 2: Firestore Access
    const firestoreResults = await testFirestoreAccess(db, user);
    
    // Output summary
    console.log('\n🎉 All Firebase tests completed successfully!');
    console.log('Summary:');
    console.log('- Authentication: ✓ Passed');
    console.log('- Firestore Access: ✓ Passed');
    console.log(`- User Profile: ${firestoreResults.userProfile ? '✓ Found' : '⚠️ Not found'}`);
    console.log(`- User Settings: ${firestoreResults.userSettings ? '✓ Found' : '⚠️ Not found'}`);
    console.log(`- Step Data Documents: ${firestoreResults.stepDataCount}`);
    
    // Sign out
    await auth.signOut();
    console.log('\n✅ User signed out successfully');
    
  } catch (error) {
    console.error('\n❌ Firebase test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runFirebaseTests().then(() => {
  console.log('Tests completed, exiting...');
  process.exit(0);
});
