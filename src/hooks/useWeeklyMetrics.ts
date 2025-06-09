import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, orderBy, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './useAuth'
import { syncStepsData } from '../services/stepsDataSyncService'

/**
 * Hook to fetch last 7 days of step data for current user.
 * Returns an array of { date: YYYY-MM-DD, steps } sorted ascending.
 * Now includes duplicate detection and automatic data repair functionality.
 */
export function useWeeklyMetrics() {
  const { user } = useAuth()
  const [data, setData] = useState<Array<{ date: string; steps: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [duplicatesDetected, setDuplicatesDetected] = useState(false)
  const [lastRepairAttempt, setLastRepairAttempt] = useState<Date | null>(null)

  // Auto repair duplicate data function
  const repairDuplicateData = useCallback(async () => {
    if (!user || !db) return false
    
    // Prevent too frequent repair attempts
    if (lastRepairAttempt && (Date.now() - lastRepairAttempt.getTime()) < 300000) { // 5 minutes
      console.log('⏳ useWeeklyMetrics: Skipping repair - recent attempt detected')
      return false
    }
    
    try {
      console.log('🔧 useWeeklyMetrics: Starting automatic duplicate data repair...')
      setLastRepairAttempt(new Date())
      
      // Trigger comprehensive data sync from HealthKit
      await syncStepsData()
      
      console.log('✅ useWeeklyMetrics: Data repair completed successfully')
      // Refetch data to see improvements
      await fetchMetrics()
      return true
    } catch (error) {
      console.error('💥 useWeeklyMetrics: Error during duplicate data repair:', error)
      return false
    }
  }, [user, lastRepairAttempt])

  // Fetch function
  const fetchMetrics = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      
      const today = new Date()
      const start = new Date()
      start.setDate(today.getDate() - 6)
      const startStr = start.toISOString().split('T')[0]
      
      console.log(`📊 useWeeklyMetrics: Fetching data from ${startStr} for user ${user.uid}`)
      
      const q = query(
        collection(db, 'userSteps'),
        where('userId', '==', user.uid),
        where('date', '>=', startStr),
        orderBy('date', 'asc')
      )
      const snapshot = await getDocs(q)
      
      console.log(`📊 useWeeklyMetrics: Found ${snapshot.size} documents`)
      
      const raw = snapshot.docs.map(doc => {
        const data = doc.data()
        console.log(`📊 useWeeklyMetrics: Document ${doc.id} - date: ${data.date}, steps: ${data.steps}, source: ${data.source}, userId: ${data.userId}`)
        return { date: data.date as string, steps: data.steps as number }
      })
      
      // Log raw data from Firestore for debugging
      console.log(`📊 useWeeklyMetrics: Raw data from Firestore:`, raw)
      
      // Generate expected date range (last 7 days)
      const dates: string[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        dates.push(d.toISOString().split('T')[0])
      }
      
      console.log(`📊 useWeeklyMetrics: Expected dates:`, dates)
      console.log(`📊 useWeeklyMetrics: Date range: ${startStr} to ${dates[dates.length - 1]}`)
      
      // Create lookup and fill missing dates with 0
      const lookup = raw.reduce((m, rec) => ({ ...m, [rec.date]: rec.steps }), {} as Record<string, number>)
      const filled = dates.map(date => ({ date, steps: lookup[date] ?? 0 }))
      
      // Check for duplicates but DO NOT modify the data - just log for debugging
      const stepCounts: Record<number, string[]> = {}
      filled.forEach(item => {
        if (item.steps > 0) {
          if (!stepCounts[item.steps]) {
            stepCounts[item.steps] = []
          }
          stepCounts[item.steps].push(item.date)
        }
      })
      
      // Enhanced duplicate detection and auto-repair
      let foundDuplicates = false
      Object.entries(stepCounts).forEach(([steps, dates]) => {
        if ((dates as string[]).length > 1) {
          foundDuplicates = true
          console.log(`⚠️ useWeeklyMetrics: DUPLICATE DETECTED - Step count ${steps} found for dates: ${(dates as string[]).join(', ')}`)
          
          // Check if this looks like a data contamination issue
          const sortedDates = (dates as string[]).sort()
          const mostRecentDate = sortedDates[sortedDates.length - 1]
          const olderDates = sortedDates.slice(0, -1)
          
          if (olderDates.length > 0) {
            console.log(`🔍 useWeeklyMetrics: Possible contamination - ${steps} steps from ${mostRecentDate} appearing in older dates: ${olderDates.join(', ')}`)
            console.log(`💡 useWeeklyMetrics: This suggests HealthKit data fetch may be bleeding across dates`)
          }
        }
      })
      
      // Set duplicate status for UI feedback
      setDuplicatesDetected(foundDuplicates)
      
      // Auto-repair if duplicates found and no recent repair attempt
      if (foundDuplicates && (!lastRepairAttempt || (Date.now() - lastRepairAttempt.getTime()) > 300000)) {
        console.log('🔧 useWeeklyMetrics: Duplicates detected - triggering auto-repair...')
        // Don't await this to avoid blocking the UI
        repairDuplicateData().catch(error => {
          console.error('💥 useWeeklyMetrics: Auto-repair failed:', error)
        })
      }
      
      // Log raw Firestore data vs filled data for comparison
      console.log(`📊 useWeeklyMetrics: Raw Firestore documents: ${raw.length}`)
      console.log(`📊 useWeeklyMetrics: Expected date range: ${dates.length} days`)
      console.log(`📊 useWeeklyMetrics: Final data (preserving HealthKit accuracy):`, filled)
      
      setData(filled)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchMetrics() }, [user, fetchMetrics])

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchMetrics,
    duplicatesDetected,
    repairDuplicateData,
    lastRepairAttempt
  }
}
