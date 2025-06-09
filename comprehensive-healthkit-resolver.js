/**
 * Comprehensive HealthKit Duplication Issue Resolver
 * This script will help identify and resolve the root cause of step data duplication
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./users.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://phr-service-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function comprehensiveHealthKitAnalysis() {
  console.log('🔍 Starting comprehensive HealthKit duplication analysis...');
  
  try {
    // Step 1: Analyze current Firestore data
    console.log('\n📊 Step 1: Analyzing current Firestore data...');
    const userStepsRef = db.collection('userSteps');
    const snapshot = await userStepsRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No step data found in Firestore');
      return;
    }
    
    const allData = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      allData.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log(`📊 Total documents: ${allData.length}`);
    
    // Group by user
    const userGroups = {};
    allData.forEach(item => {
      if (!userGroups[item.userId]) {
        userGroups[item.userId] = [];
      }
      userGroups[item.userId].push(item);
    });
    
    console.log(`👥 Number of users: ${Object.keys(userGroups).length}`);
    
    // Analyze each user's data
    for (const [userId, userData] of Object.entries(userGroups)) {
      console.log(`\n🔍 Analyzing user: ${userId}`);
      
      // Sort by date
      userData.sort((a, b) => a.date.localeCompare(b.date));
      
      console.log(`  📅 Date range: ${userData[0].date} to ${userData[userData.length - 1].date}`);
      console.log(`  📊 Total entries: ${userData.length}`);
      
      // Check for duplicates
      const duplicateGroups = {};
      userData.forEach(item => {
        if (item.steps > 0) {
          if (!duplicateGroups[item.steps]) {
            duplicateGroups[item.steps] = [];
          }
          duplicateGroups[item.steps].push(item.date);
        }
      });
      
      let hasDuplicates = false;
      Object.entries(duplicateGroups).forEach(([steps, dates]) => {
        if (dates.length > 1) {
          hasDuplicates = true;
          console.log(`  🚨 DUPLICATE: ${steps} steps on dates: ${dates.join(', ')}`);
          
          // Check if this involves the 6/7-6/9 range
          const problemDates = dates.filter(date => date >= '2025-06-07' && date <= '2025-06-09');
          if (problemDates.length > 0) {
            console.log(`    🎯 CRITICAL: This duplicate involves the reported problem dates: ${problemDates.join(', ')}`);
          }
        }
      });
      
      if (!hasDuplicates) {
        console.log(`  ✅ No duplicates found for user ${userId}`);
      }
      
      // Check sync methods
      const syncMethods = new Set(userData.map(item => item.syncMethod || 'unknown'));
      console.log(`  🔧 Sync methods used: ${Array.from(syncMethods).join(', ')}`);
      
      // Check sources
      const sources = new Set(userData.map(item => item.source || 'unknown'));
      console.log(`  📱 Data sources: ${Array.from(sources).join(', ')}`);
      
      // Check for temporal patterns
      const recentData = userData.filter(item => item.date >= '2025-06-07');
      if (recentData.length > 0) {
        console.log(`  📅 Recent data (6/7+):`);
        recentData.forEach(item => {
          console.log(`    ${item.date}: ${item.steps} steps (${item.syncMethod || 'unknown'} method)`);
        });
      }
    }
    
    // Step 2: Data cleanup recommendations
    console.log('\n🧹 Step 2: Data cleanup recommendations...');
    
    // Find all documents with duplicate step values
    const cleanupTasks = [];
    for (const [userId, userData] of Object.entries(userGroups)) {
      const duplicateGroups = {};
      userData.forEach(item => {
        if (item.steps > 0) {
          if (!duplicateGroups[item.steps]) {
            duplicateGroups[item.steps] = [];
          }
          duplicateGroups[item.steps].push(item);
        }
      });
      
      Object.entries(duplicateGroups).forEach(([steps, items]) => {
        if (items.length > 1) {
          // Keep the most recent one, mark others for cleanup
          items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          const toKeep = items[0];
          const toRemove = items.slice(1);
          
          cleanupTasks.push({
            userId,
            steps: parseInt(steps),
            keep: toKeep,
            remove: toRemove
          });
        }
      });
    }
    
    console.log(`📋 Cleanup tasks identified: ${cleanupTasks.length}`);
    
    // Step 3: Generate cleanup script
    console.log('\n📝 Step 3: Generating cleanup script...');
    
    let cleanupScript = `
// Automated Cleanup Script for HealthKit Duplicate Data
// Generated on: ${new Date().toISOString()}
// 
// This script will remove duplicate step data while preserving the most recent entries

const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('./users.json')),
  databaseURL: "https://phr-service-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function cleanupDuplicates() {
  console.log('🧹 Starting duplicate cleanup...');
  
  const cleanupTasks = ${JSON.stringify(cleanupTasks, null, 2)};
  
  for (const task of cleanupTasks) {
    console.log(\`\\n🔍 Processing duplicates for user \${task.userId}, steps: \${task.steps}\`);
    console.log(\`  ✅ Keeping: \${task.keep.date} (ID: \${task.keep.id})\`);
    
    for (const item of task.remove) {
      console.log(\`  ❌ Removing: \${item.date} (ID: \${item.id})\`);
      
      try {
        await db.collection('userSteps').doc(item.id).delete();
        console.log(\`    ✅ Deleted \${item.id}\`);
      } catch (error) {
        console.error(\`    ❌ Error deleting \${item.id}:\`, error);
      }
    }
  }
  
  console.log('\\n✅ Cleanup completed');
  process.exit(0);
}

cleanupDuplicates().catch(console.error);
`;
    
    fs.writeFileSync('./cleanup-duplicates-auto.js', cleanupScript);
    console.log('✅ Cleanup script saved to: cleanup-duplicates-auto.js');
    
    // Step 4: Generate data validation script
    console.log('\n📝 Step 4: Generating validation script...');
    
    let validationScript = `
// Data Validation Script for HealthKit Integration
// This script validates that the fix is working correctly

const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('./users.json')),
  databaseURL: "https://phr-service-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function validateHealthKitData() {
  console.log('🔍 Validating HealthKit data integrity...');
  
  const userStepsRef = db.collection('userSteps');
  const snapshot = await userStepsRef.get();
  
  const allData = [];
  snapshot.forEach(doc => {
    allData.push({ id: doc.id, ...doc.data() });
  });
  
  // Group by user
  const userGroups = {};
  allData.forEach(item => {
    if (!userGroups[item.userId]) {
      userGroups[item.userId] = [];
    }
    userGroups[item.userId].push(item);
  });
  
  let totalDuplicates = 0;
  let usersWithDuplicates = 0;
  
  for (const [userId, userData] of Object.entries(userGroups)) {
    const duplicateGroups = {};
    userData.forEach(item => {
      if (item.steps > 0) {
        if (!duplicateGroups[item.steps]) {
          duplicateGroups[item.steps] = [];
        }
        duplicateGroups[item.steps].push(item.date);
      }
    });
    
    let userHasDuplicates = false;
    Object.entries(duplicateGroups).forEach(([steps, dates]) => {
      if (dates.length > 1) {
        userHasDuplicates = true;
        totalDuplicates++;
        console.log(\`❌ User \${userId}: \${steps} steps on \${dates.join(', ')}\`);
      }
    });
    
    if (userHasDuplicates) {
      usersWithDuplicates++;
    }
  }
  
  console.log(\`\\n📊 Validation Results:\`);
  console.log(\`  Total users: \${Object.keys(userGroups).length}\`);
  console.log(\`  Users with duplicates: \${usersWithDuplicates}\`);
  console.log(\`  Total duplicate groups: \${totalDuplicates}\`);
  
  if (totalDuplicates === 0) {
    console.log('✅ No duplicates found - HealthKit integration is working correctly!');
  } else {
    console.log('❌ Duplicates still present - further investigation needed');
  }
  
  process.exit(0);
}

validateHealthKitData().catch(console.error);
`;
    
    fs.writeFileSync('./validate-healthkit-fix.js', validationScript);
    console.log('✅ Validation script saved to: validate-healthkit-fix.js');
    
    console.log('\n🎯 Summary:');
    console.log('1. Run the analysis above to understand current data state');
    console.log('2. Use cleanup-duplicates-auto.js to remove duplicates');
    console.log('3. Deploy the updated HealthKit service with cross-validation');
    console.log('4. Use validate-healthkit-fix.js to confirm the fix is working');
    console.log('5. Monitor the Debug tab in the app for real-time HealthKit behavior');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    admin.app().delete();
  }
}

comprehensiveHealthKitAnalysis();
