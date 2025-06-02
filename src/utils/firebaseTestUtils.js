// filepath: /Users/muroiyousuke/Projects/phr-service/PHRApp/src/utils/firebaseTestUtils.js
// Consolidated Firebase testing utilities

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} = require('firebase/firestore');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

/**
 * Initialize Firebase with environment variables
 * @returns {Object} - Firebase app and services
 */
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

  // Check and log each variable
  firebaseEnvVars.forEach(varName => {
    console.log(`${varName}: ${process.env[varName] ? 'Available' : 'Missing'}`);
  });

  // Firebase config
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  return { app, auth, db };
}

/**
 * Create a test user with a random email
 * @param {Object} auth - Firebase auth instance
 * @param {String} prefix - Optional email prefix (default: 'test')
 * @param {String} password - Optional password (default: 'Test12345!')
 * @returns {Object} - User credentials and user object
 */
async function createTestUser(auth, prefix = 'test', password = 'Test12345!') {
  try {
    const email = `${prefix}-${Date.now()}@example.com`;
    console.log(`Creating test user: ${email}`);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`✅ Successfully created test user: ${user.uid}`);
    return { email, password, user };
  } catch (error) {
    console.error('Error creating test user:', error.code, error.message);
    throw error;
  }
}

/**
 * Sign in with email and password
 * @param {Object} auth - Firebase auth instance
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Object} - User credential
 */
async function signInUser(auth, email, password) {
  try {
    console.log(`Signing in user: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ Successfully signed in user: ${userCredential.user.uid}`);
    return userCredential;
  } catch (error) {
    console.error('Error signing in:', error.code, error.message);
    throw error;
  }
}

/**
 * Create user data in Firestore
 * @param {Object} db - Firestore instance
 * @param {String} userId - User ID
 * @param {Object} userData - User data
 */
async function createUserData(db, userId, userData = {}) {
  try {
    const userRef = doc(db, 'users', userId);
    const defaultData = {
      displayName: userData.displayName || 'Test User',
      email: userData.email,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };
    
    await setDoc(userRef, { ...defaultData, ...userData });
    console.log(`✅ Successfully created user data for: ${userId}`);
  } catch (error) {
    console.error('Error creating user data:', error.code, error.message);
    throw error;
  }
}

/**
 * Test security rules by attempting operations with different users
 * @param {Object} auth - Firebase auth instance
 * @param {Object} db - Firestore instance
 */
async function testSecurityRules(auth, db) {
  try {
    // Create two test users for this test
    const userA = await createTestUser(auth, 'user-a');
    await signOut(auth);
    
    const userB = await createTestUser(auth, 'user-b');
    await signOut(auth);
    
    console.log('\n--- Testing Security Rules ---');
    
    // Sign in as user A and create their data
    await signInUser(auth, userA.email, userA.password);
    await createUserData(db, auth.currentUser.uid, {
      displayName: 'User A',
      email: userA.email
    });
    
    // Create a private document for user A
    const privateDocRef = doc(db, `users/${auth.currentUser.uid}/private/personal`);
    await setDoc(privateDocRef, {
      medicalId: 'A12345',
      sensitiveInfo: 'This should only be visible to user A'
    });
    console.log('✅ Created private document for User A');
    
    // Sign out and switch to user B
    await signOut(auth);
    await signInUser(auth, userB.email, userB.password);
    
    // Try to access user A's private document (should fail)
    try {
      const userAUid = userA.user.uid;
      const userAPrivateRef = doc(db, `users/${userAUid}/private/personal`);
      await getDoc(userAPrivateRef);
      console.error('❌ SECURITY ISSUE: User B accessed User A private data');
    } catch (error) {
      console.log('✅ Security rule worked: User B cannot access User A private data');
    }
    
    console.log('\n--- Security Rules Test Complete ---');
    
    // Clean up
    await deleteUser(auth.currentUser); // Delete user B
    await signInUser(auth, userA.email, userA.password); // Sign back in as user A
    await deleteUser(auth.currentUser); // Delete user A
    
    return { success: true };
  } catch (error) {
    console.error('Error in security rules test:', error);
    return { success: false, error };
  }
}

/**
 * Clean up test data and users
 * @param {Object} auth - Firebase auth instance
 * @param {Object} db - Firestore instance
 * @param {String} userId - Optional specific user ID to clean up
 */
async function cleanupTestData(auth, db, userId = null) {
  try {
    console.log('\n--- Cleaning Up Test Data ---');
    
    if (userId) {
      // Delete specific user data
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      console.log(`✅ Deleted test user data for: ${userId}`);
      
      // Delete private subcollection if exists
      const privateDocsQuery = query(collection(db, `users/${userId}/private`));
      const privateDocs = await getDocs(privateDocsQuery);
      
      for (const docSnapshot of privateDocs.docs) {
        await deleteDoc(docSnapshot.ref);
      }
      console.log(`✅ Deleted private data for: ${userId}`);
    } else {
      // Find test users by email pattern
      const usersQuery = query(
        collection(db, 'users'), 
        where('email', '>=', 'test-'), 
        where('email', '<=', 'test-\uf8ff')
      );
      
      const testUsers = await getDocs(usersQuery);
      console.log(`Found ${testUsers.size} test users to clean up`);
      
      for (const userDoc of testUsers.docs) {
        // Clean up user data
        await deleteDoc(userDoc.ref);
        console.log(`✅ Deleted test user data: ${userDoc.id}`);
      }
    }
    
    console.log('✅ Test data cleanup complete');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

// Export all utilities
module.exports = {
  initializeFirebase,
  createTestUser,
  signInUser,
  createUserData,
  testSecurityRules,
  cleanupTestData
};
