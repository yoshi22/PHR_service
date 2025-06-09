#!/usr/bin/env node

/**
 * Firebase CLI Based Firestore Data Checker
 * Uses Firebase CLI to access Firestore data directly without needing service account keys
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 FIREBASE CLI FIRESTORE DATA ANALYSIS');
console.log('=' .repeat(60));

// Function to execute Firebase CLI commands safely
function firebaseExec(command) {
  try {
    const result = execSync(`firebase ${command}`, { 
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 30000 // 30 second timeout
    });
    return result.trim();
  } catch (error) {
    console.error(`❌ Firebase CLI command failed: ${command}`);
    console.error(`Error: ${error.message}`);
    return null;
  }
}

// Check Firebase project status
function checkFirebaseStatus() {
  console.log('\n📋 Checking Firebase project status...');
  
  const projectInfo = firebaseExec('use');
  if (projectInfo) {
    console.log('✅ Firebase project info:');
    console.log(projectInfo);
  }
  
  // Get project configuration
  try {
    const configResult = firebaseExec('projects:list --format=json');
    if (configResult) {
      const projects = JSON.parse(configResult);
      const currentProject = projects.find(p => p.projectId === 'phrapp-261ae');
      if (currentProject) {
        console.log(`✅ Current project: ${currentProject.displayName} (${currentProject.projectId})`);
      }
    }
  } catch (error) {
    console.log('⚠️ Could not get detailed project info');
  }
}

// Function to query Firestore using Firebase CLI
function queryFirestoreData() {
  console.log('\n📊 Querying Firestore data using Firebase CLI...');
  
  // Try to get a list of collections first
  console.log('\n🔍 Attempting to list Firestore collections...');
  
  // Note: Firebase CLI doesn't have direct Firestore query commands
  // We need to use the REST API through Firebase CLI or create a temporary script
  
  console.log('⚠️ Firebase CLI does not provide direct Firestore querying.');
  console.log('Creating alternative Node.js script with Web SDK...');
  
  return false;
}

// Create a Web SDK based Firestore checker
function createWebSDKChecker() {
  console.log('\n📝 Creating Web SDK based Firestore checker...');
  
  const webSDKScript = `
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy } = require('firebase/firestore');

// Firebase configuration (you can get this from Firebase Console > Project Settings)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyC-your-api-key",
  authDomain: "phrapp-261ae.firebaseapp.com",
  projectId: "phrapp-261ae",
  storageBucket: "phrapp-261ae.appspot.com",
  messagingSenderId: "610776922530",
  appId: process.env.FIREBASE_APP_ID || "1:610776922530:web:your-app-id"
};

async function checkFirestoreData() {
  try {
    console.log('🔄 Initializing Firebase Web SDK...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('📊 Querying userSteps collection...');
    
    // Query userSteps collection
    const stepsRef = collection(db, 'userSteps');
    const stepsQuery = query(stepsRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(stepsQuery);
    
    if (snapshot.empty) {
      console.log('⚠️ No documents found in userSteps collection');
      return;
    }
    
    console.log(\`📋 Found \${snapshot.size} documents in userSteps collection\`);
    
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
        timestamp: data.timestamp
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
    
    // Analyze each user's data
    Object.keys(userGroups).forEach(userId => {
      const userData = userGroups[userId].sort((a, b) => b.date.localeCompare(a.date));
      
      console.log(\`\\n👤 User: \${userId}\`);
      console.log(\`📊 Total records: \${userData.length}\`);
      
      // Show recent data
      console.log('📅 Recent step data:');
      userData.slice(0, 10).forEach(item => {
        console.log(\`  \${item.date}: \${item.steps} steps (source: \${item.source})\`);
      });
      
      // Check for duplicates
      const stepCounts = {};
      userData.forEach(item => {
        if (!stepCounts[item.steps]) {
          stepCounts[item.steps] = [];
        }
        stepCounts[item.steps].push(item.date);
      });
      
      const duplicates = Object.entries(stepCounts).filter(([count, dates]) => dates.length > 1);
      if (duplicates.length > 0) {
        console.log('⚠️ Duplicate step values found:');
        duplicates.forEach(([steps, dates]) => {
          console.log(\`  \${steps} steps: \${dates.join(', ')}\`);
        });
      } else {
        console.log('✅ No duplicate step values found');
      }
    });
    
  } catch (error) {
    console.error('❌ Error querying Firestore:', error.message);
    
    // If authentication fails, provide guidance
    if (error.message.includes('auth') || error.message.includes('permission')) {
      console.log('\\n🔧 AUTHENTICATION ISSUE DETECTED');
      console.log('Try these solutions:');
      console.log('1. Check Firebase project configuration');
      console.log('2. Ensure Firestore rules allow read access');
      console.log('3. Use Firebase emulator for local testing');
    }
  }
}

checkFirestoreData().catch(console.error);
`;

  // Write the script to a file
  fs.writeFileSync('firestore-web-checker.js', webSDKScript);
  console.log('✅ Created firestore-web-checker.js');
  
  return true;
}

// Main execution
async function main() {
  checkFirebaseStatus();
  
  const canQuery = queryFirestoreData();
  if (!canQuery) {
    createWebSDKChecker();
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Install Firebase Web SDK dependencies:');
    console.log('   npm install firebase');
    console.log('');
    console.log('2. Get your Firebase config from:');
    console.log('   https://console.firebase.google.com/project/phrapp-261ae/settings/general');
    console.log('');
    console.log('3. Run the Firestore checker:');
    console.log('   node firestore-web-checker.js');
    console.log('');
    console.log('4. Alternative: Use Firebase emulator:');
    console.log('   firebase emulators:start --only firestore');
  }
}

main().catch(console.error);
