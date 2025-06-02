import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { getUserProfile, createUserProfileIfNotExists } from '../services/userProfileService';

/**
 * Hook to ensure user profile exists and handle initial
 * app loading state while profile is being checked
 */
export function useUserProfile(userId: string | null | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  
  useEffect(() => {
    async function checkAndCreateProfile() {
      try {
        if (!userId) {
          setLoading(false);
          setProfileExists(false);
          return;
        }
        
        console.log(`🧑‍💼 Checking user profile for ${userId}`);
        
        // First try to get the profile
        const profile = await getUserProfile(userId);
        
        if (profile) {
          console.log('✅ User profile exists');
          setProfileExists(true);
          setLoading(false);
          return;
        }
        
        // No profile found, create one if the user has an email
        if (!auth?.currentUser?.email) {
          throw new Error('User has no email address');
        }
        
        console.log('📝 Creating user profile...');
        await createUserProfileIfNotExists(userId, {
          email: auth.currentUser.email,
          name: auth.currentUser.displayName || ''
        });
        
        setProfileExists(true);
        console.log('✅ User profile created successfully');
        
      } catch (err: any) {
        console.error('❌ Profile check/creation error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    checkAndCreateProfile();
  }, [userId]);
  
  return { loading, error, profileExists };
}
