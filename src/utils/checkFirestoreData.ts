/**
 * Simple Firestore Data Checker
 * Uses the existing Firebase configuration from the React Native app
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Firebase configuration from app.json or environment
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

async function checkFirestoreData() {
  console.log('🔍 CHECKING FIRESTORE DATA');
  console.log('=' + '='.repeat(59));
  
  try {
    // Validate config
    if (!firebaseConfig.projectId) {
      throw new Error('Firebase project ID not found in environment');
    }
    
    console.log('🔄 Initializing Firebase...');
    console.log('Project ID:', firebaseConfig.projectId);
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Query userSteps collection
    console.log('\n📊 Querying userSteps collection...');
    
    const stepsRef = collection(db, 'userSteps');
    
    // Try different query approaches
    console.log('🔄 Attempting basic query...');
    
    try {
      // Basic query without ordering
      const basicSnapshot = await getDocs(query(stepsRef, limit(10)));
      
      if (basicSnapshot.empty) {
        console.log('⚠️ No documents found in userSteps collection');
        return;
      }
      
      console.log(`✅ Found ${basicSnapshot.size} documents`);
      
      // Analyze the documents
      const docs = [];
      basicSnapshot.forEach(doc => {
        docs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('\n📋 Sample documents:');
      docs.forEach((doc, index) => {
        console.log(`  ${index + 1}. ID: ${doc.id}`);
        console.log(`     Date: ${doc.date}`);
        console.log(`     Steps: ${doc.steps}`);
        console.log(`     User: ${doc.userId?.substring(0, 8)}...`);
        console.log(`     Source: ${doc.source}`);
        console.log(`     Sync Method: ${doc.syncMethod || 'legacy'}`);
      });
      
      // Check for duplicates
      console.log('\n🔍 Checking for duplicates...');
      const stepValues = docs.filter(d => d.steps > 0).map(d => d.steps);
      const uniqueSteps = new Set(stepValues);
      
      if (stepValues.length > uniqueSteps.size) {
        console.log('⚠️ DUPLICATES DETECTED!');
        const duplicateCounts = {};
        stepValues.forEach(steps => {
          duplicateCounts[steps] = (duplicateCounts[steps] || 0) + 1;
        });
        
        Object.entries(duplicateCounts).forEach(([steps, count]) => {
          if (count > 1) {
            console.log(`  ${steps} steps appears ${count} times`);
          }
        });
      } else {
        console.log('✅ No obvious duplicates in sample');
      }
      
    } catch (queryError) {
      console.error('❌ Query failed:', queryError.message);
      
      if (queryError.message.includes('permission')) {
        console.log('\n🔒 Permission issue detected');
        console.log('Check Firestore security rules');
      }
    }
    
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.log('\nEnvironment variables:');
    console.log('- EXPO_PUBLIC_FIREBASE_PROJECT_ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET');
    console.log('- EXPO_PUBLIC_FIREBASE_API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET');
  }
}

export default checkFirestoreData;
