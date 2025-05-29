// src/services/firestoreService.ts
import { db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * ユーザーの今日の歩数を保存
 * @param userId 現在ログイン中のユーザーUID
 * @param steps 今日の歩数
 */
export async function saveTodaySteps(userId: string, steps: number): Promise<void> {
  // Firestore のコレクション userSteps、ドキュメントID は userId_YYYY-MM-DD として日別に上書き可能に
  const today = new Date().toISOString().split('T')[0];
  const ref = doc(db, 'userSteps', `${userId}_${today}`);

  await setDoc(ref, {
    userId,
    date: today,
    steps,
    updatedAt: serverTimestamp(),
  });
}
