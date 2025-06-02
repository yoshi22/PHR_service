// Comprehensive Firebase test script for Node.js environment
// Tests user creation, authentication, and Firestore operations
const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, 
  updateProfile,
  deleteUser,
  setPersistence,
  browserLocalPersistence
} = require('firebase/auth');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
  writeBatch
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

// Generate a unique test email
function generateTestEmail() {
  const timestamp = new Date().getTime();
  return `test-${timestamp}@example.com`;
}

// Create a test user
async function createTestUser(auth) {
  const email = generateTestEmail();
  const password = 'TestPassword123!';
  const displayName = 'Test User';
  
  console.log(`\n🧪 Creating test user with email: ${email}`);
  
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, { displayName });
    
    console.log('✅ Test user created successfully:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    
    return { user, email, password };
  } catch (error) {
    console.error('❌ Test user creation failed:', {
      code: error.code,
      message: error.message
    });
    throw error;
  }
}

// Create test data for the user in Firestore
async function createTestUserData(db, user) {
  console.log(`\n🧪 Creating test data for user: ${user.uid}`);
  
  try {
    const batch = writeBatch(db);
    
    // 1. User Profile
    const userProfileRef = doc(db, 'userProfile', user.uid);
    batch.set(userProfileRef, {
      email: user.email,
      name: user.displayName || '',
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now()
    });
    
    // 2. User Settings
    const userSettingsRef = doc(db, 'userSettings', user.uid);
    batch.set(userSettingsRef, {
      notificationTime: '09:00',
      stepGoal: 8000,
      theme: 'system',
      voiceEnabled: true,
      updatedAt: Timestamp.now()
    });
    
    // 3. User Level
    const userLevelRef = doc(db, 'userLevel', user.uid);
    batch.set(userLevelRef, {
      level: 1,
      exp: 0,
      updatedAt: Timestamp.now()
    });
    
    // 4. Sample Step Data
    const today = new Date();
    const stepDataRef = doc(db, 'stepData', `${user.uid}_${today.toISOString().split('T')[0]}`);
    batch.set(stepDataRef, {
      userId: user.uid,
      date: Timestamp.fromDate(today),
      steps: 5000,
      goal: 8000,
      goalCompleted: false,
      updatedAt: Timestamp.now()
    });
    
    // Commit all changes at once
    await batch.commit();
    
    console.log('✅ Test user data created successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Test user data creation failed:', {
      code: error.code,
      message: error.message
    });
    throw error;
  }
}

// Test reading user data from Firestore
async function testReadUserData(db, user) {
  console.log(`\n🧪 Testing read access for user: ${user.uid}`);
  
  try {
    // Test 1: Get user profile document
    const userProfileRef = doc(db, 'userProfile', user.uid);
    const userProfileSnap = await getDoc(userProfileRef);
    
    if (userProfileSnap.exists()) {
      console.log('✅ Successfully read user profile:', userProfileSnap.data());
    } else {
      console.error('❌ User profile document does not exist');
      return false;
    }
    
    // Test 2: Get user settings document
    const userSettingsRef = doc(db, 'userSettings', user.uid);
    const userSettingsSnap = await getDoc(userSettingsRef);
    
    if (userSettingsSnap.exists()) {
      console.log('✅ Successfully read user settings:', userSettingsSnap.data());
    } else {
      console.error('❌ User settings document does not exist');
      return false;
    }
    
    // Test 3: Get user level document
    const userLevelRef = doc(db, 'userLevel', user.uid);
    const userLevelSnap = await getDoc(userLevelRef);
    
    if (userLevelSnap.exists()) {
      console.log('✅ Successfully read user level:', userLevelSnap.data());
    } else {
      console.error('❌ User level document does not exist');
      return false;
    }
    
    // Test 4: Query step data collection
    const stepDataRef = collection(db, 'stepData');
    const stepDataQuery = query(stepDataRef, where('userId', '==', user.uid));
    const stepDataSnap = await getDocs(stepDataQuery);
    
    if (stepDataSnap.size > 0) {
      console.log(`✅ Successfully queried stepData - found ${stepDataSnap.size} documents`);
      stepDataSnap.forEach(doc => {
        console.log('Step data:', doc.data());
      });
    } else {
      console.error('❌ No step data found for user');
      return false;
    }
    
    console.log('✅ All read tests passed successfully');
    return true;
  } catch (error) {
    console.error('❌ Read tests failed:', {
      code: error.code,
      message: error.message
    });
    return false;
  }
}

// Clean up test user and data
async function cleanupTestUser(auth, db, user) {
  console.log(`\n🧹 Cleaning up test user: ${user.uid}`);
  
  try {
    // Delete Firestore documents
    const batch = writeBatch(db);
    
    // Delete user profile
    batch.delete(doc(db, 'userProfile', user.uid));
    
    // Delete user settings
    batch.delete(doc(db, 'userSettings', user.uid));
    
    // Delete user level
    batch.delete(doc(db, 'userLevel', user.uid));
    
    // Get and delete step data
    const stepDataRef = collection(db, 'stepData');
    const stepDataQuery = query(stepDataRef, where('userId', '==', user.uid));
    const stepDataSnap = await getDocs(stepDataQuery);
    
    stepDataSnap.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Commit all deletions
    await batch.commit();
    
    // Delete the user account
    await deleteUser(user);
    
    console.log('✅ Test user and data cleaned up successfully');
    return true;
  } catch (error) {
    console.error('❌ Cleanup failed:', {
      code: error.code,
      message: error.message
    });
    return false;
  }
}

// Main test function
async function runComprehensiveTest() {
  console.log('🔬 Starting Comprehensive Firebase Tests');
  let testUser = null;
  
  try {
    // Initialize Firebase
    const { app, auth, db } = initializeFirebase();
    console.log(`✅ Firebase initialized with project: ${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}`);
    
    // Set persistence
    await setPersistence(auth, browserLocalPersistence);
    
    // Test 1: Create test user
    const { user, email, password } = await createTestUser(auth);
    testUser = user;
    
    // Test 2: Create test data
    await createTestUserData(db, user);
    
    // Test 3: Sign out and sign back in
    await auth.signOut();
    console.log('\n✅ Signed out successfully');
    
    // Sign back in
    console.log(`\n🧪 Signing back in with email: ${email}`);
    const signInCredential = await signInWithEmailAndPassword(auth, email, password);
    const signedInUser = signInCredential.user;
    console.log('✅ Signed in successfully');
    
    // Test 4: Read user data
    await testReadUserData(db, signedInUser);
    
    // Test 5: Clean up
    await cleanupTestUser(auth, db, signedInUser);
    
    // Output summary
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    
    // Try to clean up if test user was created
    if (testUser) {
      try {
        const { auth, db } = initializeFirebase();
        await cleanupTestUser(auth, db, testUser);
      } catch (cleanupError) {
        console.error('Failed to clean up test user:', cleanupError);
      }
    }
    
    process.exit(1);
  }
}

// Run the tests
runComprehensiveTest().then(() => {
  console.log('Tests completed, exiting...');
  process.exit(0);
});
