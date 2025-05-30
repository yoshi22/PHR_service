import { useState, useCallback } from 'react'
import { Platform } from 'react-native'
import { initHealthKit, initGoogleFit, checkPermissions } from '../services/healthService'

/**
 * Hook to request HealthKit / Google Fit permissions
 */
export function usePermissions() {
  const [granted, setGranted] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Check current permission status
  const checkStatus = useCallback(async (): Promise<boolean> => {
    try {
      const result = await checkPermissions();
      setGranted(result);
      return result;
    } catch (e) {
      console.error('Error checking permissions:', e);
      return false;
    }
  }, []);

  // Request permissions
  const request = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      if (Platform.OS === 'ios') {
        await initHealthKit()
      } else {
        await initGoogleFit()
      }
      setGranted(true)
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { 
    granted, 
    loading, 
    error, 
    request,
    checkStatus,
    // Alias for more intuitive name
    hasPermissions: granted 
  }
}
