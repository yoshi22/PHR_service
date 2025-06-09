/**
 * Script to verify that the dashboard now shows accurate data matching iPhone Health app
 * This validates that 6/7 shows 8,461 steps as expected from the actual device
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

// Test user ID (from previous successful tests)
const TEST_USER_ID = 'abcdef123456';

async function verifyDataAccuracy() {
  console.log('🔍 Verifying data accuracy after fixes...\n');
  
  try {
    // Get current date and calculate last 7 days
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 6);
    const startStr = startDate.toISOString().split('T')[0];
    
    console.log(`📅 Checking data from ${startStr} to today`);
    
    // Query Firestore for user steps data
    const q = query(
      collection(db, 'userSteps'),
      where('userId', '==', TEST_USER_ID),
      where('date', '>=', startStr),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    console.log(`📊 Found ${snapshot.size} documents in Firestore\n`);
    
    // Process data similar to useWeeklyMetrics
    const raw = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        date: data.date, 
        steps: data.steps, 
        source: data.source,
        timestamp: data.timestamp 
      };
    });
    
    // Generate expected date range
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    
    // Create lookup and fill missing dates
    const lookup = raw.reduce((m, rec) => ({ ...m, [rec.date]: rec }), {});
    const filled = dates.map(date => ({
      date,
      steps: lookup[date]?.steps ?? 0,
      source: lookup[date]?.source ?? 'none',
      timestamp: lookup[date]?.timestamp ?? null
    }));
    
    console.log('📊 Current Dashboard Data:');
    console.log('==========================');
    filled.forEach(item => {
      const dateObj = new Date(item.date);
      const dayName = dateObj.toLocaleDateString('en', { weekday: 'short' });
      const monthDay = dateObj.toLocaleDateString('en', { month: 'numeric', day: 'numeric' });
      
      console.log(`${dayName} ${monthDay}: ${item.steps.toLocaleString()} steps (source: ${item.source})`);
      
      // Special attention to 6/7 (which should show 8,461 steps)
      if (monthDay === '6/7') {
        if (item.steps === 8461) {
          console.log('  ✅ CORRECT: Shows 8,461 steps matching iPhone Health app');
        } else if (item.steps === 6649) {
          console.log('  ❌ INCORRECT: Still shows yesterday\'s count (6,649)');
        } else {
          console.log(`  ⚠️ UNEXPECTED: Shows ${item.steps} steps (expected 8,461)`);
        }
      }
    });
    
    // Check for duplicate patterns
    console.log('\n🔍 Duplicate Analysis:');
    console.log('======================');
    const stepCounts = {};
    filled.forEach(item => {
      if (item.steps > 0) {
        if (!stepCounts[item.steps]) {
          stepCounts[item.steps] = [];
        }
        stepCounts[item.steps].push(item.date);
      }
    });
    
    let hasDuplicates = false;
    Object.entries(stepCounts).forEach(([steps, dates]) => {
      if (dates.length > 1) {
        hasDuplicates = true;
        console.log(`⚠️ ${steps} steps found for: ${dates.join(', ')}`);
      }
    });
    
    if (!hasDuplicates) {
      console.log('✅ No obvious duplicate patterns detected');
    }
    
    // Summary
    console.log('\n📋 Summary:');
    console.log('===========');
    const june7Data = filled.find(item => item.date.endsWith('-06-07'));
    if (june7Data) {
      if (june7Data.steps === 8461) {
        console.log('✅ SUCCESS: 6/7 data is now accurate (8,461 steps)');
      } else {
        console.log(`❌ ISSUE: 6/7 still shows ${june7Data.steps} steps instead of 8,461`);
      }
    } else {
      console.log('⚠️ No data found for 6/7');
    }
    
    const nonZeroSteps = filled.filter(item => item.steps > 0);
    console.log(`📊 Days with step data: ${nonZeroSteps.length}/7`);
    console.log(`📊 Total steps this week: ${filled.reduce((sum, item) => sum + item.steps, 0).toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  }
  
  console.log('\n🔚 Verification complete');
}

// Run the verification
verifyDataAccuracy().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
