import { User } from 'firebase/compat/auth';
import { getAuth, getCurrentUser } from './firebaseUtils';

/**
 * Gets the authenticated user or throws an error if not authenticated.
 * @param options - Configuration options
 * @param options.silent - If true, returns null instead of throwing error
 * @returns Authenticated user or null (when silent=true)
 */
export const requireAuth = (options: { silent?: boolean } = {}): User | null => {
  const { silent = false } = options;
  const authInstance = getAuth();
  const user = authInstance.currentUser;
  
  if (!user) {
    if (silent) {
      return null;
    }
    throw new Error('User must be authenticated to perform this operation');
  }
  
  return user;
};

/**
 * Waits for authentication state to be determined.
 * @returns Promise that resolves to the current user or null
 */
export const waitForAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const authInstance = getAuth();
    const unsubscribe = authInstance.onAuthStateChanged((user: User | null) => {
      unsubscribe();
      resolve(user);
    });
  });
};

/**
 * Waits for an authenticated user (will throw if not authenticated).
 * @returns Promise that resolves to the authenticated user
 * @throws Error if user is not authenticated
 */
export const waitForAuthenticatedUser = async (): Promise<User> => {
  const user = await waitForAuth();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
};
