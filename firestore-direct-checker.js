const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

// Firebase configuration - using known project settings
const firebaseConfig = {
  apiKey: "AIzaSyA-PfF4MRKTRCzTpkCLfwFNJNLYsAXG8J0", // From the project config
  authDomain: "phrapp-261ae.firebaseapp.com",
  projectId: "phrapp-261ae",
  storageBucket: "phrapp-261ae.appspot.com",
  messagingSenderId: "610776922530",
  appId: "1:610776922530:web:8f4c5a5e8a5e8a5e8a5e8a"
};

async function checkFirestoreDirectly() {
  console.log('🔍 DIRECT FIRESTORE ACCESS TEST');
  console.log('=' .repeat(60));
  
  try {
    console.log('🔄 Initializing Firebase Web SDK...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    console.log(`📋 Project ID: ${firebaseConfig.projectId}`);
    
    // Try to query userSteps collection
    console.log('\n📊 Querying userSteps collection...');
    
    const stepsRef = collection(db, 'userSteps');
    const recentQuery = query(stepsRef, orderBy('date', 'desc'), limit(20));
    
    console.log('🔄 Executing query...');
    const snapshot = await getDocs(recentQuery);
    
    if (snapshot.empty) {
      console.log('⚠️ No documents found in userSteps collection');
      
      // Try to list all collections (this might fail due to permissions)
      console.log('\n🔍 Checking if collection exists...');
      
      // Try a simple query without orderBy
      const simpleQuery = query(stepsRef, limit(1));
      const simpleSnapshot = await getDocs(simpleQuery);
      
      if (simpleSnapshot.empty) {
        console.log('❌ userSteps collection appears to be empty or doesn\'t exist');
      } else {
        console.log('✅ userSteps collection exists but orderBy query failed');
      }
      
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} documents in userSteps collection`);
    
    // Analyze the data
    const stepData = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      stepData.push({
        id: doc.id,
        date: data.date,
        steps: data.steps,
        userId: data.userId,
        source: data.source,
        timestamp: data.timestamp,
        syncMethod: data.syncMethod
      });
    });
    
    // Group by user
    const userGroups = {};
    stepData.forEach(item => {
      if (!userGroups[item.userId]) {
        userGroups[item.userId] = [];
      }
      userGroups[item.userId].push(item);
    });
    
    console.log(`\n📊 Data analysis for ${Object.keys(userGroups).length} user(s):`);
    
    // Analyze each user's data
    Object.keys(userGroups).forEach((userId, userIndex) => {
      const userData = userGroups[userId].sort((a, b) => b.date.localeCompare(a.date));
      
      console.log(`\n👤 User ${userIndex + 1}: ${userId.substring(0, 8)}...`);
      console.log(`📊 Total records: ${userData.length}`);
      
      // Show recent data
      console.log('📅 Recent step data:');
      userData.slice(0, 7).forEach(item => {
        console.log(`  ${item.date}: ${item.steps?.toLocaleString() || 'N/A'} steps (${item.source || 'unknown'} - ${item.syncMethod || 'legacy'})`);
      });
      
      // Check for duplicates in this user's data
      const stepCounts = {};
      userData.forEach(item => {
        if (item.steps && item.steps > 0) {
          if (!stepCounts[item.steps]) {
            stepCounts[item.steps] = [];
          }
          stepCounts[item.steps].push(item.date);
        }
      });
      
      const duplicates = Object.entries(stepCounts).filter(([count, dates]) => dates.length > 1);
      if (duplicates.length > 0) {
        console.log('⚠️  DUPLICATE STEP VALUES FOUND:');
        duplicates.forEach(([steps, dates]) => {
          console.log(`  🔍 ${steps} steps appears on: ${dates.join(', ')}`);
          
          // Special focus on June 2025 dates (the problematic period)
          const juneDates = dates.filter(date => date.startsWith('2025-06'));
          if (juneDates.length > 1) {
            console.log(`    🎯 JUNE 2025 DUPLICATES: ${juneDates.join(', ')}`);
          }
        });
      } else {
        console.log('✅ No duplicate step values found for this user');
      }
      
      // Check for recent sync method
      const recentSyncMethods = userData.slice(0, 5).map(item => item.syncMethod).filter(Boolean);
      if (recentSyncMethods.length > 0) {
        console.log(`📱 Recent sync methods: ${[...new Set(recentSyncMethods)].join(', ')}`);
      }
    });
    
    console.log('\n✅ Firestore data analysis completed successfully');
    
  } catch (error) {
    console.error('❌ Error accessing Firestore:', error.message);
    
    if (error.message.includes('permission-denied')) {
      console.log('\n🔒 PERMISSION DENIED');
      console.log('Possible causes:');
      console.log('1. Firestore security rules are too restrictive');
      console.log('2. Authentication required but not provided');
      console.log('3. Project configuration mismatch');
      
      console.log('\n🔧 Recommended solutions:');
      console.log('1. Check Firestore rules in Firebase Console');
      console.log('2. Use Firebase emulator for local testing');
      console.log('3. Authenticate with a test user account');
    } else if (error.message.includes('not-found')) {
      console.log('\n📭 COLLECTION NOT FOUND');
      console.log('The userSteps collection may not exist yet');
      console.log('Run the iOS app to create some data first');
    } else {
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Verify Firebase project ID');
      console.log('2. Check network connectivity');
      console.log('3. Ensure Firebase SDK is properly installed');
    }
  }
}

// Run the check
checkFirestoreDirectly().catch(console.error);
