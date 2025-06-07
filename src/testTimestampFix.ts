// Test script to verify Firestore timestamp fixes
import { getUserProfile } from './services/userProfileService';
import { auth } from './firebase';

export async function testTimestampFix() {
  console.log('🧪 Testing Firestore timestamp fixes...');
  
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    console.log('⚠️ No authenticated user found. Please sign in first.');
    return;
  }
  
  try {
    console.log('📋 Testing getUserProfile...');
    const profile = await getUserProfile(currentUser.uid);
    
    if (profile) {
      console.log('✅ getUserProfile succeeded:', {
        uid: profile.uid,
        email: profile.email,
        createdAt: profile.createdAt,
        birthday: profile.birthday,
        name: profile.name
      });
    } else {
      console.log('⚠️ No profile found for user');
    }
    
    console.log('🎉 Timestamp fix test completed successfully!');
    return { success: true, profile };
    
  } catch (error: any) {
    console.error('❌ Timestamp fix test failed:', error);
    return { success: false, error: error.message };
  }
}
