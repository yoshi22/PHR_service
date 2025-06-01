import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { requireAuth } from '../utils/authUtils';

const SETTINGS_COLLECTION = 'userSettings';
const DEFAULT_STEP_GOAL = 7500;
const DEFAULT_NOTIFICATION_TIME = '20:00';

export interface UserSettings {
  stepGoal: number;
  updatedAt: Date;
  notificationTime: string; // HH:mm形式
}

/**
 * Get user settings, creates default if not exists
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  // 認証状態を確認
  const user = requireAuth();
  if (user.uid !== userId) {
    throw new Error('Unauthorized access to user settings');
  }

  const ref = doc(db, SETTINGS_COLLECTION, userId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) {
    // Create default settings
    const defaultSettings: UserSettings = {
      stepGoal: DEFAULT_STEP_GOAL,
      updatedAt: new Date(),
      notificationTime: DEFAULT_NOTIFICATION_TIME,
    };
    await setDoc(ref, defaultSettings);
    return defaultSettings;
  }
  
  const data = snap.data();
  return {
    stepGoal: data.stepGoal ?? DEFAULT_STEP_GOAL,
    updatedAt: data.updatedAt.toDate(),
    notificationTime: data.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
  };
}

/**
 * Update user step goal
 */
export async function updateStepGoal(userId: string, stepGoal: number): Promise<void> {
  // 認証状態を確認
  const user = requireAuth();
  if (user.uid !== userId) {
    throw new Error('Unauthorized access to user settings');
  }

  const ref = doc(db, SETTINGS_COLLECTION, userId);
  await setDoc(ref, {
    stepGoal,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Update notification time
 */
export async function updateNotificationTime(userId: string, notificationTime: string): Promise<void> {
  // 認証状態を確認
  const user = requireAuth();
  if (user.uid !== userId) {
    throw new Error('Unauthorized access to user settings');
  }

  if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(notificationTime)) {
    throw new Error('Invalid time format. Use HH:mm format (00:00-23:59)');
  }
  
  const ref = doc(db, SETTINGS_COLLECTION, userId);
  await setDoc(ref, {
    notificationTime,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
