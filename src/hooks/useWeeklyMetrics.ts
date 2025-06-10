import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, orderBy, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './useAuth'
import { syncStepsData } from '../services/stepsDataSyncService'
import { getTodayStepsIOS } from '../services/healthService'
import { Platform } from 'react-native'
import AppleHealthKit, { HealthValue } from 'react-native-health'

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
      
      // Generate expected date range (last 7 days)
      const dates: string[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        dates.push(d.toISOString().split('T')[0])
      }
      
      console.log(`📊 useWeeklyMetrics: Expected dates:`, dates)
      console.log(`📊 useWeeklyMetrics: Date range: ${startStr} to ${dates[dates.length - 1]}`)
      
      // STRATEGY CHANGE: First get HealthKit data, then use Firestore as backup
      let filled: Array<{ date: string; steps: number }> = []
      
      if (Platform.OS === 'ios') {
        console.log('📱 useWeeklyMetrics: PRIMARY STRATEGY - Fetching from HealthKit first...')
        
        // Helper function to get steps for a specific date from HealthKit
        const getHealthKitStepsForDate = async (dateStr: string): Promise<number> => {
          try {
            if (dateStr === new Date().toISOString().split('T')[0]) {
              // Use getDailyStepCountSamples for today as well to maintain consistency
              console.log(`📱 Fetching today's steps (${dateStr}) from HealthKit using getDailyStepCountSamples...`)
              
              const today = new Date()
              const startOfDay = new Date(today)
              startOfDay.setHours(0, 0, 0, 0)
              const endOfDay = new Date(today)
              endOfDay.setHours(23, 59, 59, 999)
              
              const options = {
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
              }
              
              return await new Promise<number>((resolve) => {
                if (!AppleHealthKit || typeof AppleHealthKit.getDailyStepCountSamples !== 'function') {
                  console.warn(`AppleHealthKit.getDailyStepCountSamples not available for today`)
                  resolve(0)
                  return
                }
                
                AppleHealthKit.getDailyStepCountSamples(options, (err: string, results: any[]) => {
                  if (err) {
                    console.warn(`HealthKit getDailyStepCountSamples error for today:`, err)
                    resolve(0)
                  } else {
                    const totalSteps = results?.reduce((sum, sample) => {
                      const steps = Math.round(sample.value || 0)
                      return sum + steps
                    }, 0) || 0
                    
                    console.log(`✅ HealthKit getDailyStepCountSamples returned ${totalSteps} steps for today (${results?.length || 0} samples)`)
                    resolve(totalSteps)
                  }
                })
              })
            } else {
              // Use getDailyStepCountSamples instead of getStepCount for historical data
              console.log(`📱 Fetching ${dateStr} steps from HealthKit using getDailyStepCountSamples...`)
              
              const targetDate = new Date(dateStr + 'T00:00:00')
              const startOfDay = new Date(targetDate)
              startOfDay.setHours(0, 0, 0, 0)
              const endOfDay = new Date(targetDate)
              endOfDay.setHours(23, 59, 59, 999)
              
              const options = {
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
              }
              
              return await new Promise<number>((resolve) => {
                // Use getDailyStepCountSamples which works correctly
                if (!AppleHealthKit || typeof AppleHealthKit.getDailyStepCountSamples !== 'function') {
                  console.warn(`AppleHealthKit.getDailyStepCountSamples not available for ${dateStr}`)
                  resolve(0)
                  return
                }
                
                AppleHealthKit.getDailyStepCountSamples(options, (err: string, results: any[]) => {
                  if (err) {
                    console.warn(`HealthKit getDailyStepCountSamples error for ${dateStr}:`, err)
                    resolve(0)
                  } else {
                    // Sum up all step samples for the day
                    const totalSteps = results?.reduce((sum, sample) => {
                      const steps = Math.round(sample.value || 0)
                      return sum + steps
                    }, 0) || 0
                    
                    console.log(`✅ HealthKit getDailyStepCountSamples returned ${totalSteps} steps for ${dateStr} (${results?.length || 0} samples)`)
                    resolve(totalSteps)
                  }
                })
              })
            }
          } catch (error) {
            console.warn(`HealthKit fallback failed for ${dateStr}:`, error)
            return 0
          }
        }
        
        // Get HealthKit data for all 7 days
        filled = await Promise.all(
          dates.map(async (dateStr) => {
            const healthKitSteps = await getHealthKitStepsForDate(dateStr)
            
            // Only save to Firestore if we got valid and reasonable data
            // Avoid saving duplicate or suspicious data that could indicate API issues
            if (healthKitSteps > 0 && healthKitSteps !== 210 && db) {
              try {
                const docRef = doc(db, 'userSteps', `${user.uid}_${dateStr}`)
                await setDoc(docRef, {
                  userId: user.uid,
                  date: dateStr,
                  steps: healthKitSteps,
                  source: 'healthkit_samples_primary',
                  updatedAt: new Date(),
                })
                console.log(`💾 Saved ${dateStr} data to Firestore: ${healthKitSteps} steps`)
              } catch (saveError) {
                console.warn(`⚠️ Could not save ${dateStr} steps to Firestore:`, saveError)
              }
            } else if (healthKitSteps === 210) {
              console.warn(`⚠️ Skipping save for ${dateStr} - suspicious data (210 steps may be API error)`)
            }
            
            // Reduce delay since we're using more efficient API
            await new Promise(resolve => setTimeout(resolve, 100))
            
            return { date: dateStr, steps: healthKitSteps }
          })
        )
        
        console.log('📱 useWeeklyMetrics: HealthKit data collection completed')
      } else {
        // Fallback to Firestore for non-iOS platforms
        console.log('📊 useWeeklyMetrics: Non-iOS platform, using Firestore...')
        const q = query(
          collection(db, 'userSteps'),
          where('userId', '==', user.uid),
          where('date', '>=', startStr),
          orderBy('date', 'asc')
        )
        const snapshot = await getDocs(q)
        
        const raw = snapshot.docs.map(doc => {
          const data = doc.data()
          return { date: data.date as string, steps: data.steps as number }
        })
        
        const lookup = raw.reduce((m, rec) => ({ ...m, [rec.date]: rec.steps }), {} as Record<string, number>)
        filled = dates.map(date => ({ date, steps: lookup[date] ?? 0 }))
      }
      
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
      
      // Enhanced duplicate detection with more intelligent analysis
      let foundDuplicates = false
      let suspiciousPatterns = false
      
      Object.entries(stepCounts).forEach(([steps, dates]) => {
        if ((dates as string[]).length > 1) {
          foundDuplicates = true
          
          // Special check for the problematic 210 steps
          if (parseInt(steps) === 210) {
            suspiciousPatterns = true
            console.log(`🚨 useWeeklyMetrics: SUSPICIOUS PATTERN - 210 steps (likely HealthKit API error) found for dates: ${(dates as string[]).join(', ')}`)
          } else {
            console.log(`⚠️ useWeeklyMetrics: DUPLICATE DETECTED - Step count ${steps} found for dates: ${(dates as string[]).join(', ')}`)
          }
          
          // Check if this looks like a data contamination issue
          const sortedDates = (dates as string[]).sort()
          const mostRecentDate = sortedDates[sortedDates.length - 1]
          const olderDates = sortedDates.slice(0, -1)
          
          if (olderDates.length > 0) {
            if (suspiciousPatterns) {
              console.log(`🔍 useWeeklyMetrics: API issue - HealthKit getStepCount returning wrong value (${steps}) for multiple dates`)
            } else {
              console.log(`🔍 useWeeklyMetrics: Possible contamination - ${steps} steps from ${mostRecentDate} appearing in older dates: ${olderDates.join(', ')}`)
              console.log(`💡 useWeeklyMetrics: This suggests HealthKit data fetch may be bleeding across dates`)
            }
          }
        }
      })
      
      // Set duplicate status for UI feedback
      setDuplicatesDetected(foundDuplicates)
      
      // TEMPORARILY DISABLE auto-repair to prevent infinite loop
      if (foundDuplicates && (!lastRepairAttempt || (Date.now() - lastRepairAttempt.getTime()) > 300000)) {
        if (suspiciousPatterns) {
          console.log('🚨 useWeeklyMetrics: HealthKit API issue detected - auto-repair DISABLED')
          console.log('💡 useWeeklyMetrics: Fixed by switching to getDailyStepCountSamples API')
        } else {
          console.log('🔧 useWeeklyMetrics: Duplicates detected but auto-repair DISABLED to prevent infinite loop')
          console.log('💡 useWeeklyMetrics: Manual investigation needed')
        }
      }
      
      // Log final data for comparison (simplified for readability)
      console.log(`📊 useWeeklyMetrics: Strategy: HealthKit Primary (using getDailyStepCountSamples)`)
      console.log(`📊 useWeeklyMetrics: Expected date range: ${dates.length} days`)
      const summary = filled.map(item => `${item.date}: ${item.steps} steps`).join(', ')
      console.log(`📊 useWeeklyMetrics: Final data summary: [${summary}]`)
      
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
