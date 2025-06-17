import * as React from 'react'
import { useAuth } from './useAuth'
import { healthDataService } from '../services'
import type { ServiceResult } from '../services/types'
import type { WeeklyStepData } from '../services/healthDataService'

const { useState, useEffect, useCallback } = React;

/**
 * Hook to fetch last 7 days of step data for current user.
 * Returns an array of { date: YYYY-MM-DD, steps } sorted ascending.
 * Uses the new service architecture for consistent data handling.
 */
export function useWeeklyMetrics() {
  const { user } = useAuth()
  const [data, setData] = useState<WeeklyStepData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [duplicatesDetected, setDuplicatesDetected] = useState(false)
  const [lastRepairAttempt, setLastRepairAttempt] = useState<Date | null>(null)

  // Auto repair duplicate data function
  const repairDuplicateData = useCallback(async () => {
    if (!user) return false
    
    // Prevent too frequent repair attempts
    if (lastRepairAttempt && (Date.now() - lastRepairAttempt.getTime()) < 300000) { // 5 minutes
      console.log('⏳ useWeeklyMetrics: Skipping repair - recent attempt detected')
      return false
    }
    
    try {
      console.log('🔧 useWeeklyMetrics: Starting automatic data repair...')
      setLastRepairAttempt(new Date())
      
      // Use the new service architecture for data repair
      const repairResult = await healthDataService.repairHealthData(user.uid)
      
      if (repairResult.success) {
        console.log('✅ useWeeklyMetrics: Data repair completed successfully')
        // Refetch data to see improvements
        await fetchMetrics()
        return true
      } else {
        console.error('💥 useWeeklyMetrics: Data repair failed:', repairResult.error)
        return false
      }
    } catch (error) {
      console.error('💥 useWeeklyMetrics: Error during data repair:', error)
      return false
    }
  }, [user, lastRepairAttempt])

  // Fetch function using new service architecture
  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`📊 useWeeklyMetrics: Fetching weekly data for user ${user.uid}`)
      
      // Use the new health data service
      const result: ServiceResult<WeeklyStepData[]> = await healthDataService.getWeeklySteps(user.uid)
      
      if (result.success && result.data) {
        const weeklyData = result.data
        
        // Check for duplicates using the service method
        const { hasDuplicates, suspiciousPatterns } = healthDataService.detectDuplicates(weeklyData)
        setDuplicatesDetected(hasDuplicates)
        
        if (hasDuplicates) {
          if (suspiciousPatterns) {
            console.log('🚨 useWeeklyMetrics: Suspicious patterns detected in data')
          } else {
            console.log('⚠️ useWeeklyMetrics: Duplicate data detected')
          }
        }
        
        // Log final data summary
        const summary = weeklyData.map(item => `${item.date}: ${item.steps} steps`).join(', ')
        console.log(`📊 useWeeklyMetrics: Data fetched successfully: [${summary}]`)
        
        setData(weeklyData)
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : '週間データの取得に失敗しました'
        console.error('❌ useWeeklyMetrics: Service error:', errorMessage)
        setError(errorMessage)
        setData([])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました'
      console.error('❌ useWeeklyMetrics: Unexpected error:', error)
      setError(errorMessage)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { 
    fetchMetrics() 
  }, [user, fetchMetrics])

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