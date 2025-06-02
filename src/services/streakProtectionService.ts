import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { requireAuth } from '../utils/authUtils';
import { getFirestore } from '../utils/firebaseUtils';

export interface StreakProtection {
  userId: string;
  activeProtections: number;  // 残りの保護回数
  usedProtections: number;    // 使用済み保護回数
  lastUsedDate: string | null; // 最後に使用した日付 (YYYY-MM-DD)
  lastRefillDate: string | null; // 最後に補充した日付 (YYYY-MM-DD)
  updatedAt: any; // serverTimestamp
}

const MAX_PROTECTIONS = 3;  // 最大保護回数
const DAYS_FOR_REFILL = 14; // 保護が補充されるまでの日数

/**
 * ストリーク保護データを取得する
 */
export async function getStreakProtection(userId: string): Promise<StreakProtection | null> {
  try {
    console.log('🛡️ getStreakProtection called for userId:', userId);
    
    // 認証状態を確認
    const user = requireAuth();
    console.log('🛡️ Auth check passed, user.uid:', user.uid);
    
    if (user.uid !== userId) {
      throw new Error('Unauthorized access to streak protection data');
    }

    const firestore = getFirestore();
    console.log('🛡️ Firestore instance obtained');
    
    const protectionRef = doc(firestore, 'streakProtections', userId);
    console.log('🛡️ Attempting to read from streakProtections collection...');
    
    const protectionSnap = await getDoc(protectionRef);
    console.log('🛡️ Firestore read result - exists:', protectionSnap.exists());
    
    if (protectionSnap.exists()) {
      return protectionSnap.data() as StreakProtection;
    }
    
    // 初回利用時は初期化
    return initializeStreakProtection(userId);
  } catch (error) {
    console.error('Error getting streak protection:', error);
    return null;
  }
}

/**
 * ストリーク保護を初期化する
 */
export async function initializeStreakProtection(userId: string): Promise<StreakProtection> {
  // 認証状態を確認
  const user = requireAuth();
  if (user.uid !== userId) {
    throw new Error('Unauthorized access to streak protection data');
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  const initialProtection: StreakProtection = {
    userId,
    activeProtections: MAX_PROTECTIONS,
    usedProtections: 0,
    lastUsedDate: null,
    lastRefillDate: today,
    updatedAt: serverTimestamp()
  };
  
  try {
    const firestore = getFirestore();
    const protectionRef = doc(firestore, 'streakProtections', userId);
    await setDoc(protectionRef, initialProtection);
    return initialProtection;
  } catch (error) {
    console.error('Error initializing streak protection:', error);
    throw error;
  }
}

/**
 * ストリーク保護を使用する
 * @returns 使用できた場合はtrue、できなかった場合はfalse
 */
export async function useStreakProtection(userId: string): Promise<boolean> {
  try {
    // 認証状態を確認
    const user = requireAuth();
    if (user.uid !== userId) {
      throw new Error('Unauthorized access to streak protection data');
    }

    const protection = await getStreakProtection(userId);
    
    if (!protection) {
      return false;
    }
    
    if (protection.activeProtections <= 0) {
      return false;
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 前回使用から5日以内の再利用は禁止
    if (protection.lastUsedDate) {
      const lastUsed = new Date(protection.lastUsedDate);
      const currentDate = new Date(today);
      const diffDays = Math.floor((currentDate.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 5) {
        console.log('Cannot use streak protection: last used less than 5 days ago');
        return false;
      }
    }
    
    const firestore = getFirestore();
    const protectionRef = doc(firestore, 'streakProtections', userId);
    await updateDoc(protectionRef, {
      activeProtections: protection.activeProtections - 1,
      usedProtections: protection.usedProtections + 1,
      lastUsedDate: today,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error using streak protection:', error);
    return false;
  }
}

/**
 * ストリーク保護を補充する（定期的に呼び出す必要あり）
 */
export async function checkAndRefillProtection(userId: string): Promise<boolean> {
  try {
    // 認証状態を確認
    const user = requireAuth();
    if (user.uid !== userId) {
      throw new Error('Unauthorized access to streak protection data');
    }

    const protection = await getStreakProtection(userId);
    
    if (!protection) {
      return false;
    }
    
    // 既に最大値なら何もしない
    if (protection.activeProtections >= MAX_PROTECTIONS) {
      return false;
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 最後の補充日をチェック
    if (protection.lastRefillDate) {
      const lastRefill = new Date(protection.lastRefillDate);
      const currentDate = new Date(today);
      const diffDays = Math.floor((currentDate.getTime() - lastRefill.getTime()) / (1000 * 60 * 60 * 24));
      
      // DAYS_FOR_REFILL日以上経過していたら補充
      if (diffDays >= DAYS_FOR_REFILL) {
        const firestore = getFirestore();
        const protectionRef = doc(firestore, 'streakProtections', userId);
        await updateDoc(protectionRef, {
          activeProtections: Math.min(protection.activeProtections + 1, MAX_PROTECTIONS),
          lastRefillDate: today,
          updatedAt: serverTimestamp()
        });
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking and refilling protection:', error);
    return false;
  }
}

/**
 * 次回の保護補充までの残り日数を取得
 */
export function getDaysUntilNextRefill(protection: StreakProtection): number {
  if (!protection.lastRefillDate) {
    return 0;
  }
  
  const lastRefill = new Date(protection.lastRefillDate);
  const currentDate = new Date();
  const diffDays = Math.floor((currentDate.getTime() - lastRefill.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, DAYS_FOR_REFILL - diffDays);
}
