import { useState, useEffect, useCallback } from 'react'
import { auth } from '../firebase'
import { useTodaySteps } from './useTodaySteps'
import { useWeeklyMetrics } from './useWeeklyMetrics'
import { getUserSettings } from '../services/userSettingsService'

interface ProgressData {
  daily: {
    current: number
    target: number
    progress: number
  }
  weekly: {
    current: number
    target: number
    progress: number
  }
}

/**
 * Hook to calculate daily and weekly progress towards goals
 */
export function useProgressTracking() {
  const [progressData, setProgressData] = useState<ProgressData>({
    daily: { current: 0, target: 7500, progress: 0 },
    weekly: { current: 0, target: 52500, progress: 0 } // 7 days × 7500 default
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { steps: todaySteps } = useTodaySteps()
  const { data: weeklyData } = useWeeklyMetrics()

  // Calculate progress based on current data
  const calculateProgress = useCallback(async () => {
    const user = auth?.currentUser
    if (!user || todaySteps === null) return

    setLoading(true)
    setError(null)

    try {
      // Get user's step goal
      const settings = await getUserSettings(user.uid)
      const dailyTarget = settings.stepGoal
      const weeklyTarget = dailyTarget * 7

      // Calculate daily progress
      const dailyProgress = Math.min((todaySteps / dailyTarget) * 100, 100)

      // Calculate weekly progress
      const weeklyTotal = weeklyData.reduce((sum, day) => sum + day.steps, 0)
      const weeklyProgress = Math.min((weeklyTotal / weeklyTarget) * 100, 100)

      setProgressData({
        daily: {
          current: todaySteps,
          target: dailyTarget,
          progress: dailyProgress
        },
        weekly: {
          current: weeklyTotal,
          target: weeklyTarget,
          progress: weeklyProgress
        }
      })
    } catch (error: any) {
      console.error('Error calculating progress:', error)
      setError(error.message || 'プログレス情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [todaySteps, weeklyData])

  useEffect(() => {
    calculateProgress()
  }, [calculateProgress])

  return {
    progressData,
    loading,
    error,
    refetch: calculateProgress
  }
}
