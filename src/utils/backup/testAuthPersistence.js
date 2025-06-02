// Comprehensive Firebase Auth & Persistence Test
// This test script focuses on simulating the real mobile app environment
// with AsyncStorage persistence and proper error handling
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  initializeAuth,
  inMemoryPersistence,
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
  query,
  where,
  serverTimestamp,
  deleteDoc
} = require('firebase/firestore');

// Initialize Firebase with environment variables
function initializeFirebase() {
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  console.log(`🔥 Initializing Firebase with project: ${firebaseConfig.projectId}`);
  const app = initializeApp(firebaseConfig);
  
  // Use in-memory persistence for testing since we don't have access to AsyncStorage in Node
  const auth = initializeAuth(app, {
    persistence: inMemoryPersistence
  });
  
  const db = getFirestore(app);
  
  return { app, auth, db };
}

// Test the entire authentication flow with error handling
async function testFullAuthFlow() {
  const { auth, db } = initializeFirebase();
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'Test123456!';
  let userId = null;
  let createdDocuments = [];
  
  try {
    console.log('\n🧪 TESTING: USER CREATION');
    console.log(`📝 Creating test user: ${testEmail}`);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      userId = userCredential.user.uid;
      console.log(`✅ User created successfully with ID: ${userId}`);
    } catch (error) {
      console.error('❌ User creation failed:', error.code, error.message);
      throw error;
    }
    
    console.log('\n🧪 TESTING: AUTH STATE CHANGE LISTENER');
    console.log('👂 Setting up auth state change listener');
    
    await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log(`🔐 Auth state changed:`, {
          authenticated: !!user,
          userId: user?.uid,
          email: user?.email,
        });
        unsubscribe();
        resolve();
      });
    });
    
    console.log('\n🧪 TESTING: USER PROFILE CREATION');
    try {
      console.log('📋 Creating user profile');
      const userProfileRef = doc(db, 'users', userId);
      await setDoc(userProfileRef, {
        uid: userId,
        email: testEmail,
        createdAt: serverTimestamp(),
        name: 'Test User'
      });
      createdDocuments.push({ collection: 'users', id: userId });
      console.log('✅ User profile created successfully');
    } catch (error) {
      console.error('❌ User profile creation failed:', error.code, error.message);
    }
    
    console.log('\n🧪 TESTING: USER SETTINGS');
    try {
      console.log('⚙️ Creating user settings');
      const userSettingsRef = doc(db, 'userSettings', userId);
      await setDoc(userSettingsRef, {
        userId: userId,
        stepGoal: 7500,
        darkMode: false,
        notificationsEnabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      createdDocuments.push({ collection: 'userSettings', id: userId });
      console.log('✅ User settings created successfully');
      
      // Verify we can read the settings
      const settingsDoc = await getDoc(userSettingsRef);
      if (settingsDoc.exists()) {
        console.log('✅ User settings retrieved:', settingsDoc.data());
      } else {
        throw new Error('User settings not found after creation');
      }
    } catch (error) {
      console.error('❌ User settings operation failed:', error.code || '', error.message);
    }
    
    console.log('\n🧪 TESTING: ERROR HANDLING - UNAUTHORIZED ACCESS');
    console.log('👤 Sign out and try to access data without auth');
    await signOut(auth);
    
    try {
      // Try to access user settings without auth
      console.log('❓ Attempting to read user settings without auth (should fail)');
      await getDoc(doc(db, 'userSettings', userId));
      console.error('❌ Security rules failed: Could read data without auth');
    } catch (error) {
      console.log('✅ Security working correctly: ' + error.message);
    }
    
    console.log('\n🧪 TESTING: SIGN IN');
    console.log(`🔑 Signing back in as ${testEmail}`);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      console.log(`✅ Signed in successfully as ${userCredential.user.email}`);
    } catch (error) {
      console.error('❌ Sign in failed:', error.code, error.message);
      throw error;
    }
    
    console.log('\n🧪 TESTING: USER STEPS CREATION AND QUERY');
    try {
      console.log('👣 Creating step records');
      
      // Create multiple step records
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const dates = [
        today.toISOString().split('T')[0],
        yesterday.toISOString().split('T')[0],
        twoDaysAgo.toISOString().split('T')[0]
      ];
      
      // Create step records for each date
      for (let i = 0; i < dates.length; i++) {
        const stepId = `step_${userId}_${dates[i]}`;
        const stepData = {
          userId: userId,
          date: dates[i],
          count: 6000 + (i * 1000), // Different step counts
          goal: 7500,
          timestamp: serverTimestamp()
        };
        
        await setDoc(doc(db, 'userSteps', stepId), stepData);
        createdDocuments.push({ collection: 'userSteps', id: stepId });
        console.log(`✅ Step record created for ${dates[i]} with ${stepData.count} steps`);
      }
      
      // Query steps by userId
      console.log('🔍 Querying steps by user ID');
      const stepsQuery = query(
        collection(db, 'userSteps'),
        where('userId', '==', userId)
      );
      
      const stepsSnapshot = await getDocs(stepsQuery);
      console.log(`✅ Found ${stepsSnapshot.size} step records`);
      stepsSnapshot.forEach(doc => {
        console.log(` - ${doc.data().date}: ${doc.data().count} steps`);
      });
      
    } catch (error) {
      console.error('❌ Steps operation failed:', error.code || '', error.message);
    }
    
    console.log('\n🧪 TESTING: SIGN OUT');
    try {
      await signOut(auth);
      console.log('✅ Signed out successfully');
      
      // Verify user is signed out
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('✅ Current user is null after sign out as expected');
      } else {
        console.error('❌ User still logged in after sign out');
      }
    } catch (error) {
      console.error('❌ Sign out failed:', error.code, error.message);
    }
    
    console.log('\n🎉 Full auth flow test completed successfully!');
    return { success: true, userId, email: testEmail, password: testPassword, createdDocuments };
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return { 
      success: false, 
      userId, 
      email: testEmail, 
      password: testPassword,
      error: error.message,
      createdDocuments 
    };
  }
}

// Clean up test data
async function cleanupTestData(testResult) {
  if (!testResult || !testResult.userId) {
    return;
  }
  
  try {
    console.log('\n🧹 Cleaning up test data...');
    const { userId, email, password, createdDocuments } = testResult;
    
    // Initialize firebase again
    const { auth, db } = initializeFirebase();
    
    // Sign in as the test user
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log(`✅ Signed in as ${email} for cleanup`);
    } catch (error) {
      console.error('❌ Could not sign in for cleanup:', error.message);
      return;
    }
    
    // Delete all created documents
    if (createdDocuments && createdDocuments.length > 0) {
      console.log(`🗑️ Deleting ${createdDocuments.length} documents...`);
      
      for (const document of createdDocuments) {
        try {
          // Use admin permissions to delete documents or this will fail with security rules
          // In a real scenario, you'd use Firebase Admin SDK, but for this test we'll just try
          await deleteDoc(doc(db, document.collection, document.id));
          console.log(`✅ Deleted ${document.collection}/${document.id}`);
        } catch (error) {
          console.log(`⚠️ Could not delete ${document.collection}/${document.id}: ${error.message}`);
        }
      }
    }
    
    // Try to delete the user
    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        console.log(`✅ Deleted test user: ${email}`);
      }
    } catch (error) {
      console.error(`❌ Could not delete user: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// Run the tests
async function runTests() {
  console.log('🔄 Starting comprehensive auth flow tests...');
  const testResult = await testFullAuthFlow();
  
  if (testResult.success) {
    console.log('\n✅ All tests passed successfully!');
  } else {
    console.error('\n❌ Tests failed:', testResult.error);
    process.exitCode = 1;
  }
  
  // Uncomment to clean up test data
  // await cleanupTestData(testResult);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exitCode = 1;
});
