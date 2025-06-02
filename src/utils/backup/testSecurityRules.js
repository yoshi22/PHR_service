// Firestore security rules test script 
// Tests authentication rules and attempts to access unauthorized data
const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut 
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

// Create two test users for security testing
async function createTestUsers(auth) {
  // Create user A
  const emailA = `user-a-${Date.now()}@example.com`;
  const passwordA = 'TestA12345!';
  const userCredentialA = await createUserWithEmailAndPassword(auth, emailA, passwordA);
  const userIdA = userCredentialA.user.uid;
  
  // Sign out user A
  await signOut(auth);
  
  // Create user B
  const emailB = `user-b-${Date.now()}@example.com`;
  const passwordB = 'TestB12345!';
  const userCredentialB = await createUserWithEmailAndPassword(auth, emailB, passwordB);
  const userIdB = userCredentialB.user.uid;
  
  // Sign out user B
  await signOut(auth);
  
  return {
    userA: { id: userIdA, email: emailA, password: passwordA },
    userB: { id: userIdB, email: emailB, password: passwordB }
  };
}

// Test Firestore security rules
async function testSecurityRules() {
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
  };
  
  console.log('🔥 Initializing Firebase for security rules testing...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  try {
    // Setup test users
    console.log('👤 Creating test users...');
    const { userA, userB } = await createTestUsers(auth);
    console.log('✅ Created test users:', {
      userA: userA.id,
      userB: userB.id
    });
    
    // ---- Test userSettings collection ----
    console.log('\n🔒 Testing userSettings collection rules...');
    
    // Sign in as user A
    console.log('🔑 Signing in as User A');
    await signInWithEmailAndPassword(auth, userA.email, userA.password);
    
    // Create settings for user A
    console.log('➕ Creating settings for User A');
    const userASettings = {
      userId: userA.id,
      stepGoal: 10000,
      darkMode: true,
      updatedAt: serverTimestamp()
    };
    
    // User A should be able to write their own settings
    try {
      await setDoc(doc(db, 'userSettings', userA.id), userASettings);
      console.log('✅ User A can create their own settings');
    } catch (error) {
      console.error('❌ User A could not create their own settings:', error.message);
    }
    
    // Try to create settings for user B (should fail)
    try {
      console.log('❓ Attempting to create settings for User B as User A (should fail)');
      const userBSettings = {
        userId: userB.id,
        stepGoal: 5000,
        darkMode: false,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'userSettings', userB.id), userBSettings);
      console.error('❌ Security rules failed: User A could create settings for User B');
    } catch (error) {
      console.log('✅ Security rules working: User A cannot create settings for User B');
    }
    
    // Sign out user A and sign in as user B
    await signOut(auth);
    console.log('🔑 Signing in as User B');
    await signInWithEmailAndPassword(auth, userB.email, userB.password);
    
    // Try to read User A's settings (should fail)
    try {
      console.log('❓ Attempting to read User A settings as User B (should fail)');
      await getDoc(doc(db, 'userSettings', userA.id));
      console.error('❌ Security rules failed: User B could read User A settings');
    } catch (error) {
      console.log('✅ Security rules working: User B cannot read User A settings');
    }
    
    // ---- Test userSteps collection ----
    console.log('\n🔒 Testing userSteps collection rules...');
    
    // Create steps for user B
    const stepId = `step_${Date.now()}`;
    const stepData = {
      userId: userB.id,
      date: new Date().toISOString().split('T')[0],
      count: 7500,
      goal: 8000,
      timestamp: serverTimestamp()
    };
    
    try {
      await setDoc(doc(db, 'userSteps', stepId), stepData);
      console.log('✅ User B can create their own step records');
    } catch (error) {
      console.error('❌ User B could not create their own step records:', error.message);
    }
    
    // Try to delete the step record (should fail per security rules)
    try {
      console.log('❓ Attempting to delete step record (should fail)');
      await deleteDoc(doc(db, 'userSteps', stepId));
      console.error('❌ Security rules failed: User B could delete step records');
    } catch (error) {
      console.log('✅ Security rules working: User B cannot delete step records');
    }
    
    // Sign out user B and sign in as user A
    await signOut(auth);
    console.log('🔑 Signing in as User A again');
    await signInWithEmailAndPassword(auth, userA.email, userA.password);
    
    // Try to read User B's steps (should fail)
    try {
      console.log('❓ Attempting to read User B step records as User A (should fail)');
      await getDoc(doc(db, 'userSteps', stepId));
      console.error('❌ Security rules failed: User A could read User B step records');
    } catch (error) {
      console.log('✅ Security rules working: User A cannot read User B step records');
    }
    
    console.log('\n🎉 Security rules tests completed');
    return true;
  } catch (error) {
    console.error('❌ Error during security rules testing:', error);
    return false;
  } finally {
    // Clean up by signing out
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (signOutError) {
      console.error('Error signing out:', signOutError);
    }
  }
}

// Run the security rules test
testSecurityRules()
  .then(success => {
    if (success) {
      console.log('✅ All security rules tests completed successfully');
    } else {
      console.error('❌ Some security rules tests failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Critical error in security rules test:', error);
    process.exit(1);
  });
