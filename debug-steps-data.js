const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, getDocs } = require('firebase/firestore');

// Firebase config (replace with your actual config)
const firebaseConfig = {
  // You'll need to add your Firebase config here
  apiKey: "AIzaSyAvlx0H8TQM-xPyKYCPdWJqINHU3jRNTr0",
  authDomain: "phr-service-d5cac.firebaseapp.com",
  projectId: "phr-service-d5cac",
  storageBucket: "phr-service-d5cac.firebasestorage.app",
  messagingSenderId: "389081414050",
  appId: "1:389081414050:web:f92ad9e4a1ccc72a3dd5ca"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkStepsData() {
  try {
    console.log('🔍 Checking userSteps data...');
    
    // Get all userSteps documents, ordered by date
    const q = query(
      collection(db, 'userSteps'),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    console.log(`📊 Found ${snapshot.size} userSteps documents`);
    
    const stepsByDate = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.date;
      
      if (!stepsByDate[date]) {
        stepsByDate[date] = [];
      }
      
      stepsByDate[date].push({
        userId: data.userId,
        steps: data.steps,
        updatedAt: data.updatedAt,
        source: data.source,
        docId: doc.id
      });
    });
    
    // Show data for last 7 days
    console.log('\n📈 Steps data by date (last 7 days):');
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (stepsByDate[dateStr]) {
        console.log(`${dateStr}: ${stepsByDate[dateStr].map(d => `${d.steps} steps (${d.source || 'unknown'})`).join(', ')}`);
      } else {
        console.log(`${dateStr}: No data`);
      }
    }
    
    // Check for duplicates
    console.log('\n🔍 Checking for potential issues:');
    Object.keys(stepsByDate).forEach(date => {
      const entries = stepsByDate[date];
      if (entries.length > 1) {
        console.log(`⚠️ Multiple entries for ${date}:`);
        entries.forEach(entry => {
          console.log(`  - ${entry.steps} steps (${entry.source || 'unknown'}) - ${entry.docId}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking steps data:', error);
  }
}

checkStepsData();
