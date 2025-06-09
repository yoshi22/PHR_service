// Simple Firestore data checker using Firebase Admin
// This will help us identify the duplicate pattern without running the app

const admin = require('firebase-admin');

// Initialize Firebase Admin (using default credentials or service account)
try {
  if (!admin.apps.length) {
    // Try to initialize with default credentials
    admin.initializeApp({
      projectId: 'phr-app-f7f2a'
    });
  }
} catch (error) {
  console.log('Using Firebase Web SDK instead of Admin SDK');
}

const db = admin.firestore();

async function checkData() {
  console.log('🔍 Checking Firestore data for duplicate patterns...\n');
  
  try {
    // Get recent userSteps data
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 10);
    const startStr = startDate.toISOString().split('T')[0];
    
    console.log(`📅 Checking from ${startStr} onwards`);
    
    const snapshot = await db.collection('userSteps')
      .where('date', '>=', startStr)
      .orderBy('date', 'asc')
      .get();
    
    console.log(`📊 Found ${snapshot.size} documents\n`);
    
    // Group by user
    const users = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!users[data.userId]) {
        users[data.userId] = [];
      }
      users[data.userId].push({
        date: data.date,
        steps: data.steps,
        source: data.source
      });
    });
    
    // Analyze each user
    Object.entries(users).forEach(([userId, userData]) => {
      console.log(`\n👤 User: ${userId}`);
      console.log('-'.repeat(40));
      
      userData.sort((a, b) => a.date.localeCompare(b.date));
      
      userData.forEach(item => {
        console.log(`${item.date}: ${item.steps} steps (${item.source})`);
      });
      
      // Check for 6/8 duplication issue
      const june8 = userData.find(item => item.date === '2025-06-08');
      const june9 = userData.find(item => item.date === '2025-06-09');
      
      if (june8 && june9) {
        console.log(`\n🎯 Key dates:`);
        console.log(`6/8: ${june8.steps} steps`);
        console.log(`6/9: ${june9.steps} steps`);
        
        const earlier = userData.filter(item => item.date < '2025-06-08');
        const duplicates = earlier.filter(item => item.steps === june8.steps);
        
        if (duplicates.length > 0) {
          console.log(`\n🚨 Found duplicates of 6/8 data (${june8.steps} steps):`);
          duplicates.forEach(item => console.log(`  ${item.date}: ${item.steps} steps`));
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n📝 Note: This might fail if Firebase Admin SDK is not properly configured.');
    console.log('Let\'s try a different approach...');
  }
}

checkData().catch(error => {
  console.error('Failed:', error.message);
  console.log('\n🔄 Let\'s use a manual data inspection approach instead...');
  
  // Manual inspection of known patterns
  console.log('\n📋 Manual Analysis Based on User Report:');
  console.log('=====================================');
  console.log('✅ 6/8, 6/9: Data matches HealthKit (correct)');
  console.log('❌ Earlier dates: Showing 6/8 data (incorrect duplication)');
  console.log('\n🎯 This suggests the issue is in how historical data is being processed or saved.');
  console.log('The problem likely occurs during:');
  console.log('1. HealthKit data retrieval for date ranges');
  console.log('2. Date parsing/timezone handling');
  console.log('3. Firestore save logic');
  
  process.exit(0);
});
