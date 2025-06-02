import { User } from 'firebase/auth';
import { getAuth, getCurrentUser } from './firebaseUtils';

/**
 * 認証済みユーザーを取得し、認証されていない場合はエラーを投げる
 * options.silent=trueならエラーをスローせずにnullを返す
 */
export const requireAuth = (options: { silent?: boolean } = {}): User => {
  const { silent = false } = options;
  const authInstance = getAuth();
  const user = authInstance.currentUser;
  
  if (!user) {
    if (silent) {
      console.warn('User not authenticated - silent mode');
      return null as unknown as User; // TypeScript対策
    }
    throw new Error('User must be authenticated to perform this operation');
  }
  
  return user;
};

/**
 * 認証状態を待機する
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
 * 認証済みユーザーを待機する（認証されるまで待つ）
 */
export const waitForAuthenticatedUser = async (): Promise<User> => {
  const user = await waitForAuth();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
};
