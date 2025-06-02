import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { 
  getUserDailyBonus, 
  canClaimDailyBonus, 
  claimDailyBonus, 
  getNextRewardPreview,
  DailyBonus, 
  BonusReward 
} from '../services/dailyBonusService'

interface UseDailyBonusReturn {
  bonusData: DailyBonus | null
  loading: boolean
  error: string | null
  canClaim: boolean
  nextRewards: BonusReward[]
  claimBonus: () => Promise<BonusReward | null>
  refetch: () => Promise<void>
}

/**
 * Custom hook for managing daily bonus functionality
 */
export function useDailyBonus(): UseDailyBonusReturn {
  const { user } = useAuth()
  const [bonusData, setBonusData] = useState<DailyBonus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canClaim, setCanClaim] = useState(false)
  const [nextRewards, setNextRewards] = useState<BonusReward[]>([])

  // Fetch bonus data
  const fetchBonusData = useCallback(async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      setError(null)
      const data = await getUserDailyBonus(user.uid)
      setBonusData(data)
      
      if (data) {
        setCanClaim(canClaimDailyBonus(data))
        setNextRewards(getNextRewardPreview(data.consecutiveDays))
      } else {
        // User hasn't initialized daily bonus yet
        setCanClaim(true)
        setNextRewards(getNextRewardPreview(0))
      }
    } catch (err: any) {
      setError(err.message || 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  // Claim daily bonus
  const claimBonus = useCallback(async (): Promise<BonusReward | null> => {
    if (!user?.uid || !canClaim) return null

    try {
      setLoading(true)
      setError(null)
      const reward = await claimDailyBonus(user.uid)
      
      // Refetch data after claiming
      await fetchBonusData()
      
      return reward
    } catch (err: any) {
      setError(err.message || 'ボーナスの受け取りに失敗しました')
      return null
    } finally {
      setLoading(false)
    }
  }, [user?.uid, canClaim, fetchBonusData])

  // Initial load
  useEffect(() => {
    fetchBonusData()
  }, [fetchBonusData])

  return {
    bonusData,
    loading,
    error,
    canClaim,
    nextRewards,
    claimBonus,
    refetch: fetchBonusData
  }
}
