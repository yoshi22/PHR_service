// src/services/firestoreService.ts
import { db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { requireAuth } from '../utils/authUtils';
import { getFirestore } from '../utils/firebaseUtils';

/**
 * ユーザーの今日の歩数を保存
 * @param userId 現在ログイン中のユーザーUID
 * @param steps 今日の歩数
 */
export async function saveTodaySteps(userId: string, steps: number): Promise<void> {
  // 認証状態を確認
  const user = requireAuth();
  if (user.uid !== userId) {
    throw new Error('Unauthorized access to user steps data');
  }

  // Firestore のコレクション userSteps、ドキュメントID は userId_YYYY-MM-DD として日別に上書き可能に
  const today = new Date().toISOString().split('T')[0];
  const firestore = getFirestore();
  const ref = doc(firestore, 'userSteps', `${userId}_${today}`);

  await setDoc(ref, {
    userId,
    date: today,
    steps,
    updatedAt: serverTimestamp(),
  });
}
