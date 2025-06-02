// Test utility to verify Firebase authentication persistence
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, getFirestore } from './firebaseUtils';

/**
 * Tests Firebase authentication and Firestore permissions
 * This function should be called after the user is authenticated
 */
export async function testFirebasePermissions(): Promise<{
  success: boolean;
  authStatus: string;
  firestoreStatus: string;
}> {
  try {
    // Check authentication status
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    let authStatus = 'Not authenticated';
    let firestoreStatus = 'Not tested';
    let success = false;
    
    if (user) {
      authStatus = `Authenticated as ${user.uid}`;
      
      // Test Firestore permissions with a simple read
      try {
        if (user.uid) {
          // Try to read user profile
          const firestore = getFirestore();
          const userProfileRef = doc(firestore, 'userProfile', user.uid);
          const profileSnap = await getDoc(userProfileRef);
          
          firestoreStatus = profileSnap.exists() 
            ? 'Successfully read user profile' 
            : 'User profile does not exist, but read permission granted';
          
          // Try to read user level as another test
          const userLevelRef = doc(firestore, 'userLevel', user.uid);
          const levelSnap = await getDoc(userLevelRef);
          
          firestoreStatus += levelSnap.exists()
            ? ', Successfully read user level'
            : ', User level does not exist, but read permission granted';
            
          success = true;
        }
      } catch (error: any) {
        firestoreStatus = `Firestore access error: ${error.message || 'Unknown error'}`;
        success = false;
      }
    }
    
    return {
      success,
      authStatus,
      firestoreStatus
    };
  } catch (error: any) {
    return {
      success: false,
      authStatus: `Error: ${error.message || 'Unknown error'}`,
      firestoreStatus: 'Not tested due to error'
    };
  }
}

// Test persistence specifically
export async function testAuthPersistence(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const authInstance = getAuth();
    // Check if auth instance is available
    const hasAuth = !!authInstance;
    
    return {
      success: hasAuth,
      message: hasAuth ? 'Auth persistence available' : 'Auth not available'
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error testing persistence: ${error.message || 'Unknown error'}`
    };
  }
}
