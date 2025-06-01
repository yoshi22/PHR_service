import { auth } from '../firebase';
import { User } from 'firebase/auth';

/**
 * 認証済みユーザーを取得し、認証されていない場合はエラーを投げる
 */
export const requireAuth = (): User => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to perform this operation');
  }
  return user;
};

/**
 * 認証状態を待機する
 */
export const waitForAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
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
