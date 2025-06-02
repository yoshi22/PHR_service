import { db } from '../firebase'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { getFirestore } from '../utils/firebaseUtils'

export interface DailyBonus {
  userId: string
  lastBonusDate: string // YYYY-MM-DD format
  consecutiveDays: number
  totalBonuses: number
  availableBonuses: number
  monthlyResetDate: string // YYYY-MM format
}

export interface BonusReward {
  type: 'experience' | 'badge' | 'special'
  value: number
  title: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

// デイリーボーナスの報酬テーブル
const BONUS_REWARDS: BonusReward[][] = [
  // Day 1-3: Common rewards
  [
    { type: 'experience', value: 50, title: '経験値ボーナス', description: '+50 XP', rarity: 'common' },
    { type: 'experience', value: 75, title: '経験値ボーナス', description: '+75 XP', rarity: 'common' },
    { type: 'experience', value: 100, title: '経験値ボーナス', description: '+100 XP', rarity: 'common' },
  ],
  // Day 4-6: Rare rewards  
  [
    { type: 'experience', value: 150, title: 'レア経験値', description: '+150 XP', rarity: 'rare' },
    { type: 'badge', value: 1, title: '特別バッジチャンス', description: 'ランダムバッジ獲得', rarity: 'rare' },
    { type: 'experience', value: 200, title: 'レア経験値', description: '+200 XP', rarity: 'rare' },
  ],
  // Day 7+: Epic/Legendary rewards
  [
    { type: 'experience', value: 300, title: 'エピック経験値', description: '+300 XP', rarity: 'epic' },
    { type: 'badge', value: 1, title: 'エピックバッジ', description: '特別バッジ確定', rarity: 'epic' },
    { type: 'special', value: 500, title: 'レジェンド報酬', description: '+500 XP + 特別称号', rarity: 'legendary' },
  ]
]

/**
 * Get user's daily bonus data
 */
export async function getUserDailyBonus(userId: string): Promise<DailyBonus | null> {
  try {
    const firestore = getFirestore();
    const bonusRef = doc(firestore, 'dailyBonuses', userId)
    const bonusSnap = await getDoc(bonusRef)
    
    if (bonusSnap.exists()) {
      return bonusSnap.data() as DailyBonus
    }
    
    // Auto-initialize if not exists
    const newBonus = await initializeDailyBonus(userId)
    return newBonus
  } catch (error) {
    console.error('Error getting daily bonus:', error)
    throw error
  }
}

/**
 * Initialize daily bonus for new user
 */
export async function initializeDailyBonus(userId: string): Promise<DailyBonus> {
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = today.substring(0, 7) // YYYY-MM
  
  const initialBonus: DailyBonus = {
    userId,
    lastBonusDate: '',
    consecutiveDays: 0,
    totalBonuses: 0,
    availableBonuses: 1,
    monthlyResetDate: currentMonth
  }
  
  try {
    const firestore = getFirestore();
    const bonusRef = doc(firestore, 'dailyBonuses', userId)
    await setDoc(bonusRef, {
      ...initialBonus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return initialBonus
  } catch (error) {
    console.error('Error initializing daily bonus:', error)
    throw error
  }
}

/**
 * Check if user can claim daily bonus today
 */
export function canClaimDailyBonus(bonusData: DailyBonus): boolean {
  const today = new Date().toISOString().split('T')[0]
  return bonusData.lastBonusDate !== today && bonusData.availableBonuses > 0
}

/**
 * Get available rewards for current streak
 */
export function getAvailableRewards(consecutiveDays: number): BonusReward[] {
  if (consecutiveDays < 3) {
    return BONUS_REWARDS[0] // Common rewards
  } else if (consecutiveDays < 7) {
    return BONUS_REWARDS[1] // Rare rewards
  } else {
    return BONUS_REWARDS[2] // Epic/Legendary rewards
  }
}

/**
 * Claim daily bonus and return random reward
 */
export async function claimDailyBonus(userId: string): Promise<BonusReward> {
  try {
    let bonusData = await getUserDailyBonus(userId)
    
    // Initialize if doesn't exist
    if (!bonusData) {
      bonusData = await initializeDailyBonus(userId)
    }
    
    // Check if can claim
    if (!canClaimDailyBonus(bonusData)) {
      throw new Error('本日のボーナスは既に受け取り済みです')
    }
    
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    // Calculate new consecutive days
    let newConsecutiveDays = 1
    if (bonusData.lastBonusDate === yesterdayStr) {
      newConsecutiveDays = bonusData.consecutiveDays + 1
    }
    
    // Check for monthly reset
    const currentMonth = today.substring(0, 7)
    const shouldReset = currentMonth !== bonusData.monthlyResetDate
    
    if (shouldReset) {
      newConsecutiveDays = 1
    }
    
    // Get available rewards and select random one
    const availableRewards = getAvailableRewards(newConsecutiveDays)
    const selectedReward = availableRewards[Math.floor(Math.random() * availableRewards.length)]
    
    // Update bonus data
    const updatedBonus: Partial<DailyBonus> = {
      lastBonusDate: today,
      consecutiveDays: newConsecutiveDays,
      totalBonuses: bonusData.totalBonuses + 1,
      availableBonuses: shouldReset ? 30 : bonusData.availableBonuses - 1, // Reset to 30 monthly
      monthlyResetDate: currentMonth,
    }
    
    const firestore = getFirestore();
    const bonusRef = doc(firestore, 'dailyBonuses', userId)
    await updateDoc(bonusRef, {
      ...updatedBonus,
      updatedAt: serverTimestamp()
    })
    
    return selectedReward
  } catch (error) {
    console.error('Error claiming daily bonus:', error)
    throw error
  }
}

/**
 * Get next reward preview for motivation
 */
export function getNextRewardPreview(consecutiveDays: number): BonusReward[] {
  const nextTier = consecutiveDays < 3 ? 1 : consecutiveDays < 7 ? 2 : 2
  return BONUS_REWARDS[Math.min(nextTier, BONUS_REWARDS.length - 1)]
}
