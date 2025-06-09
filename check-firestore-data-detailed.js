/**
 * Detailed Firestore data analysis without simulator
 * Checks for duplicate patterns in historical step data
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with service account
const serviceAccount = {
  type: "service_account",
  project_id: "phr-app-f7f2a",
  private_key_id: "your_private_key_id",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-xyz@phr-app-f7f2a.iam.gserviceaccount.com",
  client_id: "123456789",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
};

// For now, let's use a simpler approach with the Web SDK
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, getDocs, connectFirestoreEmulator } = require('firebase/firestore');

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
  console.log('🔍 Analyzing Firestore data for duplicate patterns...\n');
  
  try {
    // Get all userSteps documents from the last 14 days
    const today = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 14);
    const startStr = twoWeeksAgo.toISOString().split('T')[0];
    
    console.log(`📅 Checking data from ${startStr} to today`);
    
    // Query all recent data
    const q = query(
      collection(db, 'userSteps'),
      where('date', '>=', startStr),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    console.log(`📊 Found ${snapshot.size} total documents\n`);
    
    // Group data by user
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
        timestamp: data.timestamp
      });
    });
    
    console.log(`👥 Found data for ${userDataMap.size} users\n`);
    
    // Analyze each user's data
    userDataMap.forEach((userData, userId) => {
      console.log(`\n🔍 User: ${userId}`);
      console.log('='.repeat(50));
      
      // Sort by date
      userData.sort((a, b) => a.date.localeCompare(b.date));
      
      // Show all data
      console.log('📊 All step data:');
      userData.forEach(item => {
        const dateObj = new Date(item.date);
        const dayName = dateObj.toLocaleDateString('en', { weekday: 'short' });
        const monthDay = dateObj.toLocaleDateString('en', { month: 'numeric', day: 'numeric' });
        
        console.log(`  ${dayName} ${monthDay} (${item.date}): ${item.steps.toLocaleString()} steps (${item.source})`);
      });
      
      // Analyze duplicates
      console.log('\n🔍 Duplicate analysis:');
      const stepCounts = {};
      userData.forEach(item => {
        if (item.steps > 0) {
          if (!stepCounts[item.steps]) {
            stepCounts[item.steps] = [];
          }
          stepCounts[item.steps].push(item.date);
        }
      });
      
      let foundDuplicates = false;
      Object.entries(stepCounts).forEach(([steps, dates]) => {
        if (dates.length > 1) {
          foundDuplicates = true;
          console.log(`  ⚠️ ${steps} steps found for: ${dates.join(', ')}`);
          
          // Check if this is the 6/8 duplication issue
          if (dates.includes('2025-06-08')) {
            console.log(`    🎯 ISSUE DETECTED: 6/8 data (${steps} steps) duplicated to other dates`);
          }
        }
      });
      
      if (!foundDuplicates) {
        console.log('  ✅ No duplicate step counts found');
      }
      
      // Check for patterns
      console.log('\n📈 Pattern analysis:');
      const last7Days = userData.slice(-7);
      if (last7Days.length >= 7) {
        const recentSteps = last7Days.map(item => item.steps);
        const uniqueRecentSteps = new Set(recentSteps);
        
        if (uniqueRecentSteps.size === 1 && recentSteps[0] > 0) {
          console.log(`  🚨 ALL 7 days have identical steps: ${recentSteps[0]} (likely simulator issue)`);
        } else if (uniqueRecentSteps.size < recentSteps.length) {
          console.log(`  ⚠️ Some duplicates in recent 7 days: ${recentSteps.join(', ')}`);
        } else {
          console.log(`  ✅ All recent days have unique step counts`);
        }
      }
      
      // Focus on the specific issue: 6/8, 6/9 correct, others duplicated
      console.log('\n🎯 Specific issue check (6/8 duplication):');
      const june8Data = userData.find(item => item.date === '2025-06-08');
      const june9Data = userData.find(item => item.date === '2025-06-09');
      
      if (june8Data && june9Data) {
        console.log(`  📅 6/8: ${june8Data.steps} steps`);
        console.log(`  📅 6/9: ${june9Data.steps} steps`);
        
        // Check if earlier dates have 6/8's step count
        const earlierDates = userData.filter(item => item.date < '2025-06-08');
        const duplicatesOf68 = earlierDates.filter(item => item.steps === june8Data.steps);
        
        if (duplicatesOf68.length > 0) {
          console.log(`  🚨 CONFIRMED ISSUE: These dates have 6/8's step count (${june8Data.steps}):`);
          duplicatesOf68.forEach(item => {
            console.log(`    - ${item.date}: ${item.steps} steps`);
          });
        } else {
          console.log(`  ✅ No earlier dates have 6/8's step count`);
        }
      }
    });
    
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log(`Total documents analyzed: ${snapshot.size}`);
    console.log(`Users with data: ${userDataMap.size}`);
    console.log(`Date range: ${startStr} to ${today.toISOString().split('T')[0]}`);
    
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
