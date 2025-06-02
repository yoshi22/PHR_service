// Comprehensive Firebase Auth and Firestore test that simulates the full app flow
// This script should be run with Node.js and test both authentication and Firestore operations
const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
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
  Timestamp,
  serverTimestamp
} = require('firebase/firestore');

// Load environment variables 
require('dotenv').config({ path: '.env.local' });

// Configuration validation
function validateConfig() {
  const requiredEnvVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
}

// Initialize Firebase
function initializeFirebase() {
  validateConfig();
  
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  console.log('Initializing Firebase with project:', firebaseConfig.projectId);
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  return { app, auth, db };
}

// Simulate the full app flow
async function simulateFullAppFlow() {
  console.log('🔄 Starting full app flow simulation...');
  
  const { app, auth, db } = initializeFirebase();
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'Test123456!';
  let userId = null;
  
  try {
    // 1. Create a new user
    console.log(`\n📝 Creating test user: ${testEmail}`);
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    userId = userCredential.user.uid;
    console.log(`✅ User created with ID: ${userId}`);

    // 2. Create user profile
    console.log(`\n📋 Creating user profile for ${userId}`);
    const userProfileData = {
      uid: userId,
      email: testEmail,
      createdAt: serverTimestamp(),
      name: 'Test User'
    };
    
    await setDoc(doc(db, 'users', userId), userProfileData);
    console.log('✅ User profile created');

    // 3. Create user settings
    console.log('\n⚙️ Creating user settings');
    const userSettingsData = {
      userId: userId,
      stepGoal: 8000,
      darkMode: false,
      notificationsEnabled: true,
      notificationTime: '08:00',
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'userSettings', userId), userSettingsData);
    console.log('✅ User settings created');

    // 4. Create user badge
    console.log('\n🏅 Creating sample user badge');
    const badgeId = `badge_${Date.now()}`;
    const badgeData = {
      userId: userId,
      badgeType: 'first_steps',
      earnedAt: serverTimestamp(),
      name: 'First Steps',
      description: 'Completed your first day of tracking'
    };
    
    await setDoc(doc(db, 'userBadges', badgeId), badgeData);
    console.log('✅ User badge created');

    // 5. Create step record
    console.log('\n👣 Creating sample step record');
    const stepId = `step_${Date.now()}`;
    const stepData = {
      userId: userId,
      date: new Date().toISOString().split('T')[0],
      count: 5432,
      goal: 8000,
      timestamp: serverTimestamp()
    };
    
    await setDoc(doc(db, 'userSteps', stepId), stepData);
    console.log('✅ Step record created');

    // 6. Verify reading works by fetching user profile
    console.log('\n🔍 Verifying user profile read operation');
    const userProfileDoc = await getDoc(doc(db, 'users', userId));
    if (userProfileDoc.exists()) {
      console.log('✅ User profile read successful:', userProfileDoc.data());
    } else {
      console.error('❌ User profile not found');
    }

    // 7. Verify query works by getting user badges
    console.log('\n🔍 Verifying user badges query');
    const badgesQuery = query(
      collection(db, 'userBadges'),
      where('userId', '==', userId)
    );
    
    const badgesSnapshot = await getDocs(badgesQuery);
    console.log(`✅ Found ${badgesSnapshot.size} badges for user`);
    badgesSnapshot.forEach(doc => {
      console.log(' - Badge:', doc.data().name);
    });

    // 8. Sign out
    console.log('\n🚪 Signing out user');
    await signOut(auth);
    console.log('✅ User signed out');

    // 9. Sign in again
    console.log(`\n🔑 Signing in as ${testEmail}`);
    await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ Signed in successfully');
    
    // 10. Get auth state
    console.log('\n👤 Checking auth state');
    if (auth.currentUser) {
      console.log(`✅ Current user: ${auth.currentUser.email} (ID: ${auth.currentUser.uid})`);
    } else {
      console.error('❌ No current user found');
    }
    
    console.log('\n🎉 Full app flow simulation completed successfully');
  } catch (error) {
    console.error('❌ Error during simulation:', error);
    return false;
  } finally {
    // Clean up by signing out
    try {
      if (auth.currentUser) {
        await signOut(auth);
        console.log('👋 Signed out after test');
      }
    } catch (signOutError) {
      console.error('Error signing out:', signOutError);
    }
  }
  
  return true;
}

// Run the simulation
simulateFullAppFlow()
  .then(success => {
    if (success) {
      console.log('✅ All Firebase operations completed successfully');
    } else {
      console.error('❌ Some operations failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Critical error in test:', error);
    process.exit(1);
  });
