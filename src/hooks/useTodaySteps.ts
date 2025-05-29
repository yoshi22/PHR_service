import { useState, useEffect, useCallback } from 'react'
import { Platform } from 'react-native'
import { initHealthKit, getTodayStepsIOS, initGoogleFit, getTodayStepsAndroid } from '../services/healthService'
import { saveTodaySteps } from '../services/firestoreService'
import { auth } from '../firebase'

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
      if (user) await saveTodaySteps(user.uid, count)
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
