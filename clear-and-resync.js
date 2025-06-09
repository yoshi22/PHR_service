/**
 * Clear Firestore duplicate data and trigger re-sync
 * This will help test the new individual date query logic
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

// Known test user ID
const TEST_USER_ID = 'abcdef123456';

async function clearAndResync() {
  console.log('🧹 Clearing duplicate Firestore data for re-sync...\n');
  
  try {
    // Get current data
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 7);
    const startStr = startDate.toISOString().split('T')[0];
    
    console.log(`📅 Checking data from ${startStr} onwards`);
    
    const q = query(
      collection(db, 'userSteps'),
      where('userId', '==', TEST_USER_ID),
      where('date', '>=', startStr),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    console.log(`📊 Found ${snapshot.size} documents to analyze\n`);
    
    if (snapshot.size === 0) {
      console.log('⚠️ No data found for the test user');
      return;
    }
    
    // Analyze data for duplicates
    const userData = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      userData.push({
        id: doc.id,
        date: data.date,
        steps: data.steps,
        source: data.source
      });
    });
    
    userData.sort((a, b) => a.date.localeCompare(b.date));
    
    console.log('📊 Current data:');
    userData.forEach(item => {
      console.log(`  ${item.date}: ${item.steps} steps (${item.source})`);
    });
    
    // Check for the specific 6/8 duplication issue
    const june8Data = userData.find(item => item.date === '2025-06-08');
    const june9Data = userData.find(item => item.date === '2025-06-09');
    
    if (june8Data && june9Data) {
      console.log(`\n🎯 Key dates analysis:`);
      console.log(`6/8: ${june8Data.steps} steps`);
      console.log(`6/9: ${june9Data.steps} steps`);
      
      const earlierDates = userData.filter(item => item.date < '2025-06-08');
      const duplicatesOf68 = earlierDates.filter(item => item.steps === june8Data.steps);
      
      if (duplicatesOf68.length > 0) {
        console.log(`\n🚨 CONFIRMED: Found duplicates of 6/8 data (${june8Data.steps} steps):`);
        duplicatesOf68.forEach(item => {
          console.log(`  - ${item.date}: ${item.steps} steps (SHOULD BE DELETED)`);
        });
        
        // Optional: Delete the duplicate entries
        console.log(`\n🗑️ Option to delete ${duplicatesOf68.length} duplicate entries...`);
        console.log('(Uncomment the deletion code below to actually delete)');
        
        // Uncomment to actually delete:
        // for (const duplicate of duplicatesOf68) {
        //   await deleteDoc(doc(db, 'userSteps', duplicate.id));
        //   console.log(`✅ Deleted duplicate: ${duplicate.date}`);
        // }
        
      } else {
        console.log(`\n✅ No duplicates of 6/8 data found in earlier dates`);
      }
    }
    
    console.log(`\n📋 Summary:`);
    console.log(`Total documents: ${snapshot.size}`);
    console.log(`Date range: ${startStr} to today`);
    console.log(`Next step: Re-run the app to trigger new HealthKit sync with individual date queries`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n✅ Analysis complete');
}

// Manual approach for now
console.log('📋 Firestore Data Cleanup Analysis');
console.log('==================================');
console.log('');
console.log('🎯 Problem: Historical dates showing 6/8 step count');
console.log('🔧 Solution: Individual date queries in HealthKit sync');
console.log('');
console.log('✅ New Logic Implemented:');
console.log('- stepsDataSyncService.ts: Individual date queries');
console.log('- Enhanced date validation and precise time ranges');
console.log('- Prevention of cross-date data contamination');
console.log('');
console.log('🚀 To test the fix:');
console.log('1. Re-run the iOS app');
console.log('2. Trigger HealthKit sync (login + dashboard refresh)');
console.log('3. Check that each date shows unique, accurate step counts');
console.log('4. Verify 6/7 shows 8,461 steps (as reported correct by user)');
console.log('');
console.log('📊 Expected Results After Fix:');
console.log('- Each date will have its own accurate HealthKit data');
console.log('- No more cross-date contamination');
console.log('- 6/8, 6/9: Continue to show correct values');
console.log('- Earlier dates: Show their actual HealthKit values');

// Run the analysis
clearAndResync().catch(error => {
  console.error('Failed:', error.message);
  process.exit(1);
});
