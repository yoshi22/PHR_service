import { useState } from 'react'
import { syncStepsData } from '../services/stepsDataSyncService'

interface SyncResult {
  updated: number
  repaired: number
}

/**
 * Hook for syncing steps data with HealthKit
 */
export const useStepsDataSync = () => {
  const [isLoading, setIsLoading] = useState(false)

  const syncMissingSteps = async (days: number = 7): Promise<SyncResult | null> => {
    setIsLoading(true)
    try {
      console.log(`🔄 Syncing missing steps for past ${days} days...`)
      
      await syncStepsData()
      
      return {
        updated: days, // Assume all days were updated for now
        repaired: 0
      }
    } catch (error) {
      console.error('Error syncing missing steps:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const autoRepairData = async (days: number = 7): Promise<SyncResult | null> => {
    setIsLoading(true)
    try {
      console.log(`🔄 Auto-repairing data for past ${days} days...`)
      
      await syncStepsData()
      
      return {
        updated: 0,
        repaired: days // Assume all days were repaired for now
      }
      
      return null
    } catch (error) {
      console.error('Error auto-repairing data:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    syncMissingSteps,
    autoRepairData,
    isLoading
  }
}