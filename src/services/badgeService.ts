import { db } from '../firebase'
import { collection, query, where, orderBy, getDocs, doc, setDoc, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore'
import { requireAuth } from '../utils/authUtils'

export interface BadgeRecord {
  date: string
  type: string
  awardedAt: Date
  isNew?: boolean // Flag to indicate if this is a newly acquired badge
}

const badgeCollection = 'userBadges'

// Events
const badgeListeners: Array<(badge: BadgeRecord) => void> = [];

/**
 * Subscribe to badge acquisition events
 * @param callback Function to call when new badge is acquired
 * @returns Unsubscribe function
 */
export function onBadgeAcquired(callback: (badge: BadgeRecord) => void) {
  badgeListeners.push(callback);
  return () => {
    const index = badgeListeners.indexOf(callback);
    if (index > -1) {
      badgeListeners.splice(index, 1);
    }
  };
}

/**
 * Notify listeners about a new badge
 */
function notifyBadgeAcquired(badge: BadgeRecord) {
  badgeListeners.forEach(listener => listener({ ...badge, isNew: true }));
}

/**
 * Save a badge record for a user on a given date.
 * Merges to avoid duplication.
 */
export async function saveBadge(userId: string, date: string, type: string): Promise<void> {
  // 認証状態を確認
  const user = requireAuth();
  if (user.uid !== userId) {
    throw new Error('Unauthorized access to badge data');
  }

  const id = `${userId}_${date}_${type}`
  const ref = doc(db, badgeCollection, id)
  
  // First check if badge already exists to avoid duplicate notifications
  const docRef = doc(db, badgeCollection, id);
  const docSnap = await getDocs(query(collection(db, badgeCollection), where('__name__', '==', id)));
  const isNew = docSnap.empty;
  
  await setDoc(
    ref,
    { userId, date, type, awardedAt: serverTimestamp() },
    { merge: true }
  )
  
  // If this is a new badge, notify listeners
  if (isNew) {
    const newBadge = {
      date,
      type,
      awardedAt: new Date(),
      isNew: true
    };
    notifyBadgeAcquired(newBadge);
  }
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

/**
 * Subscribe to user's badge updates in real-time
 */
export function subscribeToBadges(userId: string, onUpdate: (badges: BadgeRecord[]) => void): () => void {
  const q = query(
    collection(db, badgeCollection),
    where('userId', '==', userId),
    orderBy('awardedAt', 'desc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const badges = snapshot.docs.map(d => ({
      date: d.data().date as string,
      type: d.data().type as string,
      awardedAt: (d.data().awardedAt as Timestamp).toDate(),
      // Mark as new if this document was just added
      isNew: snapshot.docChanges().some(
        change => change.type === 'added' && change.doc.id === d.id
      )
    }));
    
    onUpdate(badges);
    
    // Notify about new badges
    badges.filter(b => b.isNew).forEach(notifyBadgeAcquired);
  });
}
