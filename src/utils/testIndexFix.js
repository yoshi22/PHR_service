// Test script to verify the Firestore index fix
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Firebase config (you can replace with your actual config)
const firebaseConfig = {
  // Your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testDailyCheckinsQuery() {
  try {
    console.log('Testing dailyCheckins query with index...');
    
    // This is the exact query that was failing
    const q = query(
      collection(db, 'dailyCheckins'),
      where('userId', '==', 'test-user-id'),
      orderBy('date', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('✅ Query successful! Found', querySnapshot.size, 'documents');
    
    querySnapshot.forEach((doc) => {
      console.log('Document data:', doc.data());
    });
    
    return true;
  } catch (error) {
    console.error('❌ Query failed:', error);
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      console.log('🔧 Index is still building. Please wait a few minutes and try again.');
      console.log('You can also create it manually in the Firebase Console.');
    }
    return false;
  }
}

// Run the test
testDailyCheckinsQuery();
