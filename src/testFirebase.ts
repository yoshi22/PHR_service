import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { getUserSettings } from './services/userSettingsService';

/**
 * Test Firebase authentication and Firestore access
 * This is a temporary test file to verify our fixes work
 */
export async function testFirebaseConnection() {
  console.log('🧪 Starting Firebase Connection Test...');
  
  try {
    // Type guard
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
    
    // Test 1: Sign in with existing test user
    console.log('🧪 Test 1: Attempting to sign in with test user...');
    const userCredential = await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
    const user = userCredential.user;
    
    console.log('✅ Test 1 Passed: Authentication successful', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });
    
    // Test 2: Access Firestore data
    console.log('🧪 Test 2: Attempting to access Firestore data...');
    const userSettings = await getUserSettings(user.uid);
    
    console.log('✅ Test 2 Passed: Firestore access successful', userSettings);
    
    // Test 3: Sign out
    console.log('🧪 Test 3: Signing out...');
    if (auth) {
      await auth.signOut();
    }
    console.log('✅ Test 3 Passed: Sign out successful');
    
    console.log('🎉 All Firebase tests passed! The fixes are working.');
    return {
      success: true,
      message: 'All Firebase tests passed successfully'
    };
    
  } catch (error: any) {
    console.error('❌ Firebase test failed:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}
