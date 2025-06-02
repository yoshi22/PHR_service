import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from '../utils/firebaseUtils';

export interface UserProfile {
  uid: string;
  email: string;
  createdAt: Date;
  birthday?: Date;
  name?: string;
}

/**
 * Get user profile data including registration date
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const firestore = getFirestore();
    const userDoc = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userDoc);
    
    if (!userSnap.exists()) {
      console.warn(`User profile not found for userId: ${userId}`);
      return null;
    }
    
    const userData = userSnap.data();
    return {
      uid: userData.uid,
      email: userData.email,
      createdAt: userData.createdAt?.toDate() || new Date(),
      birthday: userData.birthday?.toDate(),
      name: userData.name
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get user registration date
 */
export async function getUserRegistrationDate(userId: string): Promise<Date | null> {
  const profile = await getUserProfile(userId);
  return profile?.createdAt || null;
}

/**
 * Create user profile if it doesn't exist
 * @param userId User ID
 * @param userData User data (email, name, etc)
 */
export async function createUserProfileIfNotExists(userId: string, userData: { email: string; name?: string }): Promise<boolean> {
  try {
    // Check if profile exists
    const firestore = getFirestore();
    const userProfileRef = doc(firestore, 'userProfile', userId);
    const profileSnap = await getDoc(userProfileRef);
    
    if (!profileSnap.exists()) {
      // Create new profile
      await setDoc(userProfileRef, {
        uid: userId,
        email: userData.email,
        name: userData.name || '',
        createdAt: serverTimestamp(),
      });
      console.log(`Created new user profile for user: ${userId}`);
      
      // Also ensure user document exists in the users collection
      const userDocRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          uid: userId,
          email: userData.email,
          name: userData.name || '',
          createdAt: serverTimestamp(),
        });
        console.log(`Created new user document for user: ${userId}`);
      }

      // Initialize cached level
      const cachedLevelRef = doc(firestore, 'cachedLevel', userId);
      await setDoc(cachedLevelRef, {
        userId,
        level: 1,
        xp: 0,
        updatedAt: serverTimestamp()
      });
      
      // Initialize user level
      const userLevelRef = doc(firestore, 'userLevel', userId);
      await setDoc(userLevelRef, {
        userId,
        level: 1,
        xp: 0,
        updatedAt: serverTimestamp()
      });
      
      // Initialize daily bonus
      const dailyBonusRef = doc(firestore, 'dailyBonuses', userId);
      await setDoc(dailyBonusRef, {
        userId,
        lastBonusDate: null,
        consecutiveDays: 0,
        totalBonuses: 0,
        availableBonuses: 0,
        updatedAt: serverTimestamp()
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return false;
  }
}
