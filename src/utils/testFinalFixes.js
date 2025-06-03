// Final test to verify our Firebase permission fixes
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, collection, query, where, getDocs, orderBy, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAQg4F1Z7nFuuf6sPSQ8k6pbrK1ycC26X0",
  authDomain: "phrapp-261ae.firebaseapp.com",
  projectId: "phrapp-261ae",
  storageBucket: "phrapp-261ae.firebasestorage.app",
  messagingSenderId: "610776922530",
  appId: "1:610776922530:web:86da909672c20ecd461afb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testFixedFunctions() {
  console.log('🔥 Testing fixed Firebase functions...');
  
  try {
    // Sign in anonymously to test
    const userCredential = await signInAnonymously(auth);
    const userId = userCredential.user.uid;
    console.log('✅ Signed in anonymously with ID:', userId);

    // Test getUserGoals function (fixed)
    console.log('\n🎯 Testing getUserGoals query...');
    const goalsQuery = query(
      collection(db, 'userGoals'),
      where('userId', '==', userId)
    );
    const goalsSnapshot = await getDocs(goalsQuery);
    console.log('✅ getUserGoals query executed successfully');
    console.log('   Goals found:', goalsSnapshot.size);

    // Test getTodayCheckin function (fixed)
    console.log('\n📅 Testing getTodayCheckin query...');
    const today = new Date().toISOString().split('T')[0];
    const checkinQuery = query(
      collection(db, 'dailyCheckins'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(10)
    );
    const checkinSnapshot = await getDocs(checkinQuery);
    console.log('✅ getTodayCheckin query executed successfully');
    console.log('   Checkins found:', checkinSnapshot.size);

    console.log('\n🎉 All Firebase permission fixes verified!');
    console.log('✅ The app should now work without "Missing or insufficient permissions" errors');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
  }
}

testFixedFunctions().catch(console.error);
