import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Test user creation and Firestore access with production security rules
 * This simulates the sign-up flow to test both authentication and Firestore permissions
 */
export async function testUserCreationAndFirestore() {
  console.log('🧪 Testing user creation and Firestore access...');
  
  const testEmail = `test.user.${Date.now()}@example.com`;
  const testPassword = 'password123';
  
  try {
    // Step 1: Create user with Firebase Auth
    console.log('🧪 Step 1: Creating user with Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    
    console.log('✅ Step 1 Passed: User created successfully', {
      uid: user.uid,
      email: user.email
    });
    
    // Step 2: Test Firestore write (simulating SignUpScreen flow)
    console.log('🧪 Step 2: Testing Firestore writes...');
    
    // Create user profile
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      birthDate: new Date().toISOString(),
      gender: 'male',
      displayName: 'Test User',
      createdAt: new Date().toISOString(),
    });
    
    // Create user settings
    await setDoc(doc(db, 'userSettings', user.uid), {
      userId: user.uid,
      stepGoal: 7500,
      notificationTime: '20:00',
      updatedAt: new Date().toISOString(),
    });
    
    console.log('✅ Step 2 Passed: Firestore writes successful');
    
    // Step 3: Test Firestore read
    console.log('🧪 Step 3: Testing Firestore reads...');
    const { getUserSettings } = await import('./services/userSettingsService.js');
    const settings = await getUserSettings(user.uid);
    
    console.log('✅ Step 3 Passed: Firestore reads successful', settings);
    
    // Step 4: Clean up (sign out)
    console.log('🧪 Step 4: Cleaning up...');
    await auth.signOut();
    console.log('✅ Step 4 Passed: Sign out successful');
    
    console.log('🎉 All tests passed! Firebase and Firestore are working correctly with proper security rules.');
    
    return {
      success: true,
      message: 'All Firebase and Firestore tests passed',
      testUser: { uid: user.uid, email: testEmail }
    };
    
  } catch (error: any) {
    console.error('❌ Test failed:', {
      step: 'User creation and Firestore test',
      code: error.code,
      message: error.message
    });
    
    // Clean up on error
    try {
      if (auth.currentUser) {
        await auth.signOut();
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}
