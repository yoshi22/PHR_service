// Test script to verify step data consistency
// This script can be run independently to check Firestore data

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin (you'll need to set up service account)
// const serviceAccount = require('./path-to-service-account-key.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

const db = admin.firestore();

async function checkStepDataConsistency(userId) {
  try {
    console.log('🔍 Checking step data consistency for user:', userId);
    
    // Get all step data for the user
    const stepsCollection = db.collection('users').doc(userId).collection('steps');
    const snapshot = await stepsCollection.orderBy('date', 'desc').limit(30).get();
    
    const stepData = [];
    const duplicates = new Map();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const dateKey = data.date;
      
      stepData.push({
        id: doc.id,
        date: dateKey,
        steps: data.steps,
        timestamp: data.timestamp?.toDate?.() || 'No timestamp'
      });
      
      // Check for duplicates
      if (duplicates.has(dateKey)) {
        duplicates.get(dateKey).push(data);
      } else {
        duplicates.set(dateKey, [data]);
      }
    });
    
    // Report findings
    console.log('\n📊 Step Data Summary:');
    console.log(`Total records: ${stepData.length}`);
    
    // Check for duplicate dates
    let duplicateCount = 0;
    duplicates.forEach((records, date) => {
      if (records.length > 1) {
        duplicateCount++;
        console.log(`⚠️ Duplicate date found: ${date} (${records.length} records)`);
        records.forEach((record, index) => {
          console.log(`  ${index + 1}. Steps: ${record.steps}, Timestamp: ${record.timestamp}`);
        });
      }
    });
    
    if (duplicateCount === 0) {
      console.log('✅ No duplicate dates found');
    }
    
    // Check for identical step counts across different days
    const stepCounts = new Map();
    stepData.forEach(record => {
      const steps = record.steps;
      if (stepCounts.has(steps)) {
        stepCounts.get(steps).push(record.date);
      } else {
        stepCounts.set(steps, [record.date]);
      }
    });
    
    console.log('\n🔍 Checking for identical step counts on different days:');
    let identicalStepsFound = false;
    stepCounts.forEach((dates, steps) => {
      if (dates.length > 1 && steps > 0) {
        identicalStepsFound = true;
        console.log(`⚠️ ${steps} steps found on multiple days: ${dates.join(', ')}`);
      }
    });
    
    if (!identicalStepsFound) {
      console.log('✅ No suspicious identical step counts found');
    }
    
    // Show recent data
    console.log('\n📅 Recent Step Data:');
    stepData.slice(0, 7).forEach(record => {
      console.log(`${record.date}: ${record.steps} steps (${record.timestamp})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking data consistency:', error);
  }
}

// Example usage (replace with actual user ID)
// checkStepDataConsistency('your-user-id-here');

console.log('🚀 Data consistency checker ready');
console.log('Usage: checkStepDataConsistency("your-user-id")');

module.exports = { checkStepDataConsistency };
