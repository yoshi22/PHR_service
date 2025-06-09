// Quick Firebase data check
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDrqVq3QoT87JKwxJCzJJ9TqSlJZqV9b94",
  authDomain: "phr-app-f7f2a.firebaseapp.com", 
  projectId: "phr-app-f7f2a",
  storageBucket: "phr-app-f7f2a.firebasestorage.app",
  messagingSenderId: "1004653848444",
  appId: "1:1004653848444:web:2af0845c5e48d60ae68e76"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkData() {
  console.log('🔍 Checking current Firestore data...');
  
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 6);
  const startStr = startDate.toISOString().split('T')[0];
  
  const q = query(
    collection(db, 'userSteps'),
    where('date', '>=', startStr),
    orderBy('date', 'asc')
  );
  
  const snapshot = await getDocs(q);
  console.log(`Found ${snapshot.size} documents`);
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`${data.date}: ${data.steps} steps (${data.source})`);
  });
}

checkData().catch(console.error);
