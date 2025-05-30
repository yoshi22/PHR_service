import { useState, useEffect, useCallback } from 'react'
import { Platform } from 'react-native'
import { initHealthKit, getTodayStepsIOS, initGoogleFit, getTodayStepsAndroid } from '../services/healthService'
import { saveTodaySteps } from '../services/firestoreService'
import { auth } from '../firebase'
import { saveBadge } from '../services/badgeService'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Hook to fetch today's steps and save to Firestore.
 * Returns steps count, loading and error state.
 */
export function useTodaySteps() {
  const [steps, setSteps] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSteps = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let count: number
      if (Platform.OS === 'ios') {
        await initHealthKit()
        count = await getTodayStepsIOS()
      } else {
        await initGoogleFit()
        count = await getTodayStepsAndroid()
      }
      setSteps(count)
      const user = auth.currentUser
      if (user) {
        await saveTodaySteps(user.uid, count)
        // Badge: award if threshold reached
        if (count >= 7500) {
          const today = new Date().toISOString().split('T')[0]
          await saveBadge(user.uid, today, '7500_steps')
          // 3日連続バッジ判定
          const dates = [0, 1, 2].map(offset => {
            const d = new Date()
            d.setDate(d.getDate() - offset)
            return d.toISOString().split('T')[0]
          })
          const streakQ = query(
            collection(db, 'userSteps'),
            where('userId', '==', user.uid),
            where('date', 'in', dates)
          )
          const streakSnap = await getDocs(streakQ)
          const stepsList = streakSnap.docs.map(d => d.data().steps as number)
          if (stepsList.length === 3 && stepsList.every(s => s >= 7500)) {
            await saveBadge(user.uid, today, '3days_streak')
          }
        }
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSteps()
  }, [fetchSteps])

  return { steps, error, loading, refetch: fetchSteps }
}
