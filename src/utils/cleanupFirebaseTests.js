// filepath: /Users/muroiyousuke/Projects/phr-service/PHRApp/src/utils/cleanupFirebaseTests.js
// Firebase test cleanup utility
// This script finds and removes test data created by Firebase tests

const {
  initializeFirebase,
  cleanupTestData
} = require('./firebaseTestUtils');

/**
 * Main cleanup function
 */
async function cleanup() {
  try {
    console.log('Initializing Firebase for test data cleanup...');
    const { auth, db } = initializeFirebase();
    
    // Clean up all test user data
    await cleanupTestData(auth, db);
    
    console.log('\n✅ Firebase test cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Firebase test cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup when script is executed directly
if (require.main === module) {
  cleanup().catch(error => {
    console.error('Error in cleanup execution:', error);
    process.exit(1);
  });
}

module.exports = { cleanup };
