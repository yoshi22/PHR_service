import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db, auth } from '../firebase'

interface StreakData {
  currentStreak: number
  longestStreak: number
  streakStartDate: string | null
  lastActivityDate: string | null
  isActiveToday: boolean
}

/**
 * Hook to manage user streak tracking
 * Tracks consecutive days where user met their step goal
 */
export function useStreakTracker() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    streakStartDate: null,
    lastActivityDate: null,
    isActiveToday: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate streak from step data
  const calculateStreak = useCallback(async (stepGoal: number = 7500) => {
    const user = auth?.currentUser
    if (!user) {
      setError('ユーザーが認証されていません')
      return
    }

    if (!db) {
      setError('Firebase Firestore が初期化されていません')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get user's step data for the last 365 days, ordered by date descending
      const stepsQuery = query(
        collection(db, 'userSteps'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(365)
      )
      
      const stepsSnapshot = await getDocs(stepsQuery)
      const stepsByDate = new Map<string, number>()
      
      stepsSnapshot.forEach(doc => {
        const data = doc.data()
        stepsByDate.set(data.date, data.steps || 0)
      })

      // Calculate current streak
      let currentStreak = 0
      let longestStreak = 0
      let currentStreakLength = 0
      let streakStartDate: string | null = null
      let lastActivityDate: string | null = null
      
      const today = new Date().toISOString().split('T')[0]
      const isActiveToday = (stepsByDate.get(today) || 0) >= stepGoal

      // Check consecutive days from today backwards
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date()
        checkDate.setDate(checkDate.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]
        
        const steps = stepsByDate.get(dateStr) || 0
        const metGoal = steps >= stepGoal

        if (metGoal) {
          if (currentStreakLength === 0) {
            // Starting a new streak
            if (i === 0) {
              currentStreak = 1
              streakStartDate = dateStr
            } else if (i === 1 && !isActiveToday) {
              // Yesterday's activity counts if today is not active yet
              currentStreak = 1
              streakStartDate = dateStr
            }
          } else if (i === currentStreakLength) {
            // Continuing current streak
            currentStreak++
            streakStartDate = dateStr
          }
          
          currentStreakLength++
          
          if (!lastActivityDate) {
            lastActivityDate = dateStr
          }
          
          // Track longest streak
          if (currentStreakLength > longestStreak) {
            longestStreak = currentStreakLength
          }
        } else {
          // Streak broken
          if (i === 0) {
            // Today doesn't count, check yesterday
            continue
          } else if (currentStreakLength > 0) {
            // End of a streak
            if (longestStreak < currentStreakLength) {
              longestStreak = currentStreakLength
            }
            currentStreakLength = 0
          }
        }
      }

      // If we're in the middle of a streak, update longest streak
      if (currentStreakLength > longestStreak) {
        longestStreak = currentStreakLength
      }

      const newStreakData: StreakData = {
        currentStreak,
        longestStreak,
        streakStartDate,
        lastActivityDate,
        isActiveToday
      }

      setStreakData(newStreakData)

    } catch (error: any) {
      console.error('Error calculating streak:', error)
      setError(error.message || 'ストリーク情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  // Get user's step goal and calculate streak
  const fetchStreak = useCallback(async () => {
    const user = auth?.currentUser
    if (!user) return

    try {
      // Get user's step goal from settings
      const userSettingsService = await import('../services/userSettingsService.js')
      const settings = await userSettingsService.getUserSettings(user.uid)
      await calculateStreak(settings.stepGoal)
    } catch (error) {
      console.error('Error fetching streak:', error)
      // Fallback to default goal
      await calculateStreak(7500)
    }
  }, [calculateStreak])

  useEffect(() => {
    fetchStreak()
  }, [fetchStreak])

  // Get streak status message
  const getStreakStatus = (): string => {
    if (streakData.currentStreak === 0) {
      return streakData.isActiveToday ? '今日から新しいストリークを開始！' : '目標達成でストリークを開始しよう'
    } else if (streakData.currentStreak === 1) {
      return streakData.isActiveToday ? '1日連続達成中！' : '昨日達成、今日も頑張ろう！'
    } else {
      return `${streakData.currentStreak}日連続達成中！`
    }
  }

  // Get days until milestone
  const getDaysToMilestone = (): { days: number; milestone: string } | null => {
    const milestones = [3, 7, 14, 30, 50, 100]
    
    for (const milestone of milestones) {
      if (streakData.currentStreak < milestone) {
        return {
          days: milestone - streakData.currentStreak,
          milestone: milestone === 3 ? '3日間' : 
                   milestone === 7 ? '1週間' :
                   milestone === 14 ? '2週間' :
                   milestone === 30 ? '1ヶ月' :
                   milestone === 50 ? '50日' : '100日'
        }
      }
    }
    
    return null
  }

  return {
    streakData,
    loading,
    error,
    refetch: fetchStreak,
    getStreakStatus,
    getDaysToMilestone
  }
}
