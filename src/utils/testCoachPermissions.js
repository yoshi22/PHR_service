// Test script to verify userGoals and dailyCheckins permissions
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, query, where, getDocs, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAQg4F1Z7nFuuf6sPSQ8k6pbrK1ycC26X0",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "phrapp-261ae.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "phrapp-261ae",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "phrapp-261ae.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "610776922530",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:610776922530:web:86da909672c20ecd461afb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testCoachPermissions() {
  console.log('🔥 Testing userGoals and dailyCheckins permissions...');
  
  try {
    // Create test user
    console.log('👤 Creating test user...');
    const testEmail = `test-coach-${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const userId = userCredential.user.uid;
    console.log('✅ Test user created:', userId);

    // Test userGoals collection
    console.log('\n🎯 Testing userGoals collection...');
    
    // Create a goal
    const goalData = {
      userId: userId,
      title: 'Test Goal',
      description: 'Testing goal creation',
      active: true,
      completed: false,
      targetDate: new Date('2025-12-31'),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const goalRef = await addDoc(collection(db, 'userGoals'), goalData);
    console.log('✅ Created goal:', goalRef.id);
    
    // Query user's goals
    const goalsQuery = query(
      collection(db, 'userGoals'),
      where('userId', '==', userId)
    );
    const goalsSnapshot = await getDocs(goalsQuery);
    console.log('✅ Retrieved goals count:', goalsSnapshot.size);

    // Test dailyCheckins collection
    console.log('\n📅 Testing dailyCheckins collection...');
    
    // Create a checkin
    const checkinData = {
      userId: userId,
      date: new Date().toISOString().split('T')[0], // Today's date
      type: 'morning',
      mood: 7,
      energy: 8,
      notes: 'Test morning checkin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const checkinRef = await addDoc(collection(db, 'dailyCheckins'), checkinData);
    console.log('✅ Created checkin:', checkinRef.id);
    
    // Query user's checkins
    const checkinsQuery = query(
      collection(db, 'dailyCheckins'),
      where('userId', '==', userId)
    );
    const checkinsSnapshot = await getDocs(checkinsQuery);
    console.log('✅ Retrieved checkins count:', checkinsSnapshot.size);

    console.log('\n🎉 All coach permission tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error code:', error.code);
  }
}

testCoachPermissions().catch(console.error);
