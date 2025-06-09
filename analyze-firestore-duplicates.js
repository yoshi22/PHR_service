/**
 * Script to analyze current Firestore data and identify duplicate patterns
 * This helps understand why historical data shows 6/8 values instead of accurate data
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrqVq3QoT87JKwxJCzJJ9TqSlJZqV9b94",
  authDomain: "phr-app-f7f2a.firebaseapp.com",
  projectId: "phr-app-f7f2a",
  storageBucket: "phr-app-f7f2a.firebasestorage.app",
  messagingSenderId: "1004653848444",
  appId: "1:1004653848444:web:2af0845c5e48d60ae68e76",
  measurementId: "G-TZ5DLR98Z8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function analyzeFirestoreData() {
  console.log('🔍 Analyzing Firestore data to identify duplicate issue...\n');
  
  try {
    // Get all userSteps documents to see the full picture
    const q = query(
      collection(db, 'userSteps'),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    console.log(`📊 Total documents in userSteps collection: ${snapshot.size}\n`);
    
    // Group by user to analyze each user's data
    const userDataMap = new Map();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      
      if (!userDataMap.has(userId)) {
        userDataMap.set(userId, []);
      }
      
      userDataMap.get(userId).push({
        id: doc.id,
        date: data.date,
        steps: data.steps,
        source: data.source,
        timestamp: data.timestamp,
        syncMethod: data.syncMethod || 'unknown'
      });
    });
    
    console.log(`👥 Found data for ${userDataMap.size} users\n`);
    
    // Analyze each user's data
    userDataMap.forEach((userData, userId) => {
      console.log(`\n👤 User: ${userId}`);
      console.log(`📊 Total records: ${userData.length}`);
      
      // Sort by date
      userData.sort((a, b) => a.date.localeCompare(b.date));
      
      // Show recent 7 days
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - 6);
      const startStr = startDate.toISOString().split('T')[0];
      
      const recentData = userData.filter(item => item.date >= startStr);
      
      console.log(`📅 Last 7 days data (from ${startStr}):`);
      recentData.forEach(item => {
        const dateObj = new Date(item.date);
        const dayName = dateObj.toLocaleDateString('en', { weekday: 'short' });
        const monthDay = dateObj.toLocaleDateString('en', { month: 'numeric', day: 'numeric' });
        
        console.log(`  ${dayName} ${monthDay} (${item.date}): ${item.steps.toLocaleString()} steps (${item.source}, ${item.syncMethod})`);
      });
      
      // Check for duplicates in recent data
      const stepCounts = {};
      recentData.forEach(item => {
        if (item.steps > 0) {
          if (!stepCounts[item.steps]) {
            stepCounts[item.steps] = [];
          }
          stepCounts[item.steps].push(item.date);
        }
      });
      
      console.log(`\n🔍 Duplicate analysis for user ${userId}:`);
      let foundDuplicates = false;
      Object.entries(stepCounts).forEach(([steps, dates]) => {
        if (dates.length > 1) {
          foundDuplicates = true;
          console.log(`  ⚠️ ${steps} steps found for: ${dates.join(', ')}`);
          
          // Identify if this matches the reported issue (6/8 data contaminating earlier dates)
          const june8 = '2025-06-08';
          const june9 = '2025-06-09';
          
          if (dates.includes(june8) || dates.includes(june9)) {
            const otherDates = dates.filter(d => d !== june8 && d !== june9);
            if (otherDates.length > 0) {
              console.log(`    🎯 ISSUE IDENTIFIED: Recent data (${dates.filter(d => d === june8 || d === june9).join(', ')}) contaminating older dates: ${otherDates.join(', ')}`);
            }
          }
        }
      });
      
      if (!foundDuplicates) {
        console.log(`  ✅ No duplicates found for this user`);
      }
      
      // Check sync methods
      const syncMethods = [...new Set(recentData.map(item => item.syncMethod))];
      console.log(`\n🔧 Sync methods used: ${syncMethods.join(', ')}`);
      
      // Check sources
      const sources = [...new Set(recentData.map(item => item.source))];
      console.log(`📱 Data sources: ${sources.join(', ')}`);
    });
    
    console.log('\n📋 Analysis Summary:');
    console.log('===================');
    console.log('This analysis helps identify if:');
    console.log('1. HealthKit sync is bleeding data across dates');
    console.log('2. Firestore contains contaminated historical data');
    console.log('3. The individual-day-fetch method will resolve the issue');
    
  } catch (error) {
    console.error('❌ Error analyzing Firestore data:', error);
  }
}

// Run the analysis
analyzeFirestoreData().then(() => {
  console.log('\n🔚 Analysis complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
