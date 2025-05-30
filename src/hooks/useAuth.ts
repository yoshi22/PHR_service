import { useState, useEffect } from 'react'
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '../firebase'

/**
 * Hook to subscribe to Firebase auth state.
 * Returns current user and initialization status.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u)
      if (initializing) setInitializing(false)
    })
    return unsubscribe
  }, [initializing])
  
  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return { user, initializing, signOut }
}
