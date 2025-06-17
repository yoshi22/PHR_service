import * as React from 'react'
import { useAuth } from './useAuth'
import { useTodaySteps } from './useTodaySteps'
import { useWeeklyMetrics } from './useWeeklyMetrics'
import { useSettings } from '../context/SettingsContext'

const { useState, useEffect, useCallback } = React;

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
 * Uses modern React patterns and the new service architecture
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
  const { settings } = useSettings() // Use settings from context

  const { user } = useAuth()

  // Calculate progress based on current data
  const calculateProgress = useCallback(async () => {
    if (!user || todaySteps === null) return

    setLoading(true)
    setError(null)

    try {
      // Use step goal from settings context (default to 7500 if not available)
      const dailyTarget = settings?.stepGoal || 7500
      
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
      console.error('❌ useProgressTracking: Error calculating progress:', error)
      setError(error.message || 'プログレス情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [todaySteps, weeklyData, settings?.stepGoal])

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
