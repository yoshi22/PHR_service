import { db } from '../firebase'
import { collection, query, where, orderBy, getDocs, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'

export interface BadgeRecord {
  date: string
  type: string
  awardedAt: Date
}

const badgeCollection = 'userBadges'

/**
 * Save a badge record for a user on a given date.
 * Merges to avoid duplication.
 */
export async function saveBadge(userId: string, date: string, type: string): Promise<void> {
  const id = `${userId}_${date}_${type}`
  const ref = doc(db, badgeCollection, id)
  await setDoc(
    ref,
    { userId, date, type, awardedAt: serverTimestamp() },
    { merge: true }
  )
}

/**
 * Fetch all badges for a user, sorted by awardedAt desc.
 */
export async function getBadges(userId: string): Promise<BadgeRecord[]> {
  const q = query(
    collection(db, badgeCollection),
    where('userId', '==', userId),
    orderBy('awardedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    date: d.data().date as string,
    type: d.data().type as string,
    awardedAt: (d.data().awardedAt as Timestamp).toDate(),
  }))
}
