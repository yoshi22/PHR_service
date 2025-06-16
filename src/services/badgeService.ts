import { db } from '../firebase'
import { collection, query, where, orderBy, getDocs, doc, setDoc, serverTimestamp, Timestamp, onSnapshot, getDoc } from 'firebase/firestore'
import { requireAuth } from '../utils/authUtils'
import { getFirestore } from '../utils/firebaseUtils'

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
  try {
    // 認証状態を確認
    const user = requireAuth();
    if (!user) {
      throw new Error('User must be authenticated');
    }
    if (user.uid !== userId) {
      throw new Error('Unauthorized access to badge data');
    }
    console.log('🏅 Saving badge:', { userId, date, type });
  } catch (authError: any) {
    console.error('❌ Authentication error in saveBadge:', authError);
    throw authError;
  }

  const firestore = getFirestore();
  const id = `${userId}_${date}_${type}`
  const ref = doc(firestore, badgeCollection, id)
  
  // First check if badge already exists to avoid duplicate notifications
  let isNew = true;
  try {
    const docSnap = await getDoc(doc(firestore, badgeCollection, id));
    isNew = !docSnap.exists();
  } catch (error) {
    console.warn('Unable to check for existing badge, proceeding with save:', error);
    isNew = true; // Assume it's new if we can't check
  }
  
  try {
    await setDoc(
      ref,
      { userId, date, type, awardedAt: serverTimestamp() },
      { merge: true }
    )
    console.log('✅ Badge saved successfully:', { userId, date, type });
  } catch (firestoreError: any) {
    console.error('❌ Firestore error saving badge:', firestoreError);
    console.error('Firestore error details:', {
      code: firestoreError?.code,
      message: firestoreError?.message,
      userId,
      date,
      type
    });
    throw firestoreError;
  }
  
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
  const firestore = getFirestore();
  const q = query(
    collection(firestore, badgeCollection),
    where('userId', '==', userId),
    orderBy('awardedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data();
    
    // Safely handle Firestore Timestamp conversion
    let awardedAt: Date;
    try {
      awardedAt = data.awardedAt && typeof data.awardedAt.toDate === 'function' 
        ? data.awardedAt.toDate() 
        : new Date();
    } catch (error: any) {
      console.warn('Error converting awardedAt timestamp:', error);
      awardedAt = new Date();
    }
    
    return {
      date: data.date as string,
      type: data.type as string,
      awardedAt,
    };
  });
}

/**
 * Subscribe to user's badge updates in real-time
 */
export function subscribeToBadges(userId: string, onUpdate: (badges: BadgeRecord[]) => void): () => void {
  const firestore = getFirestore();
  const q = query(
    collection(firestore, badgeCollection),
    where('userId', '==', userId),
    orderBy('awardedAt', 'desc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const badges = snapshot.docs.map(d => {
      const data = d.data();
      
      // Safely handle Firestore Timestamp conversion
      let awardedAt: Date;
      try {
        awardedAt = data.awardedAt && typeof data.awardedAt.toDate === 'function' 
          ? data.awardedAt.toDate() 
          : new Date();
      } catch (error: any) {
        console.warn('Error converting awardedAt timestamp:', error);
        awardedAt = new Date();
      }
      
      return {
        date: data.date as string,
        type: data.type as string,
        awardedAt,
        // Mark as new if this document was just added
        isNew: snapshot.docChanges().some(
          change => change.type === 'added' && change.doc.id === d.id
        )
      };
    });
    
    onUpdate(badges);
    
    // Notify about new badges
    badges.filter(b => b.isNew).forEach(notifyBadgeAcquired);
  });
}
