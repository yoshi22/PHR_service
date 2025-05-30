import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './useAuth'

/**
 * Hook to fetch last 7 days of step data for current user.
 * Returns an array of { date: YYYY-MM-DD, steps } sorted ascending.
 */
export function useWeeklyMetrics() {
  const { user } = useAuth()
  const [data, setData] = useState<Array<{ date: string; steps: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch function
  const fetchMetrics = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const today = new Date()
      const start = new Date()
      start.setDate(today.getDate() - 6)
      const startStr = start.toISOString().split('T')[0]
      const q = query(
        collection(db, 'userSteps'),
        where('userId', '==', user.uid),
        where('date', '>=', startStr),
        orderBy('date', 'asc')
      )
      const snapshot = await getDocs(q)
      const raw = snapshot.docs.map(doc => ({ date: doc.data().date as string, steps: doc.data().steps as number }))
      const dates: string[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        dates.push(d.toISOString().split('T')[0])
      }
      const lookup = raw.reduce((m, rec) => ({ ...m, [rec.date]: rec.steps }), {} as Record<string, number>)
      const filled = dates.map(date => ({ date, steps: lookup[date] ?? 0 }))
      setData(filled)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchMetrics() }, [user, fetchMetrics])

  return { data, loading, error, refetch: fetchMetrics }
}
