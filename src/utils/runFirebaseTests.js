// filepath: /Users/muroiyousuke/Projects/phr-service/PHRApp/src/utils/runFirebaseTests.js
// Consolidated Firebase test runner
// This script runs comprehensive Firebase tests including auth, Firestore, and security rules

const {
  initializeFirebase,
  createTestUser,
  signInUser,
  createUserData,
  testSecurityRules,
  cleanupTestData
} = require('./firebaseTestUtils');

/**
 * Run a basic Firebase connectivity test
 */
async function testFirebaseConnectivity() {
  try {
    console.log('\n=== FIREBASE CONNECTIVITY TEST ===');
    const { app, auth, db } = initializeFirebase();
    console.log('✅ Firebase initialized successfully');
    return { success: true, app, auth, db };
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return { success: false, error };
  }
}

/**
 * Run a basic authentication test
 */
async function testAuthentication({ auth, db }) {
  try {
    console.log('\n=== FIREBASE AUTHENTICATION TEST ===');
    const testUser = await createTestUser(auth);
    console.log(`Test user created: ${testUser.email}`);
    
    // Sign out and sign back in to test authentication
    await auth.signOut();
    console.log('✅ User signed out successfully');
    
    await signInUser(auth, testUser.email, testUser.password);
    console.log('✅ User signed back in successfully');
    
    // Create user data in Firestore
    await createUserData(db, auth.currentUser.uid, { email: testUser.email });
    
    // Clean up
    try {
      await auth.currentUser.delete();
      console.log('✅ Test user deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting test user:', error);
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    return { success: false, error };
  }
}

/**
 * Run all Firebase tests
 */
async function runAllTests() {
  try {
    console.log('Starting Firebase tests...');
    
    // Test 1: Basic connectivity
    const connectivityResult = await testFirebaseConnectivity();
    if (!connectivityResult.success) {
      throw new Error('Firebase connectivity test failed');
    }
    
    const { auth, db } = connectivityResult;
    
    // Test 2: Authentication
    const authResult = await testAuthentication({ auth, db });
    if (!authResult.success) {
      throw new Error('Authentication test failed');
    }
    
    // Test 3: Security rules
    const securityResult = await testSecurityRules(auth, db);
    if (!securityResult.success) {
      throw new Error('Security rules test failed');
    }
    
    console.log('\n✅ All Firebase tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Firebase tests failed:', error);
    process.exit(1);
  }
}

// Run all tests when script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Error in test execution:', error);
    process.exit(1);
  });
}

module.exports = {
  testFirebaseConnectivity,
  testAuthentication,
  runAllTests
};
