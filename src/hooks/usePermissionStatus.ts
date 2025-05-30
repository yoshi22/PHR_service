import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { usePermissions } from './usePermissions'

const PERMISSION_STORAGE_KEY = '@phrapp:permissions_granted'

/**
 * Checks if permissions have been granted previously
 * and manages permission state between sessions
 */
export function usePermissionStatus() {
  const { granted, loading, error, request, checkStatus } = usePermissions()
  const [hasChecked, setHasChecked] = useState(false)
  const [storedGranted, setStoredGranted] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Load previous permission state
  useEffect(() => {
    const checkStoredPermission = async () => {
      try {
        console.log('Checking permission state, refresh trigger:', refreshTrigger);
        // First check AsyncStorage
        const data = await AsyncStorage.getItem(PERMISSION_STORAGE_KEY)
        const isGranted = data === 'true'
        
        // Also check actual permission status from the native APIs
        const actualPermStatus = await checkStatus()
        console.log('Permission check results - Stored:', isGranted, 'Actual:', actualPermStatus);
        
        if (actualPermStatus) {
          // Always trust the actual permission status if it's granted
          setStoredGranted(true)
          await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'true')
        } else {
          // If actual permissions aren't granted, use the stored value
          setStoredGranted(isGranted)
        }
      } catch (e) {
        console.error('Failed to load permission state', e)
      } finally {
        setHasChecked(true)
      }
    }
    
    checkStoredPermission()
  }, [checkStatus, refreshTrigger])

  // Store permission state when granted changes
  useEffect(() => {
    if (granted) {
      AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'true')
        .then(() => setStoredGranted(true))
        .catch(e => console.error('Failed to save permission state', e))
    }
  }, [granted])

  // Function to clear stored permissions (useful for testing or when permissions are revoked)
  const clearStoredPermissions = async () => {
    try {
      await AsyncStorage.removeItem(PERMISSION_STORAGE_KEY);
      setStoredGranted(false);
    } catch (e) {
      console.error('Failed to clear permission state', e);
    }
  };

  // Function to handle permission request that also updates stored state
  const handleRequestPermissions = async (): Promise<boolean> => {
    try {
      const granted = await request();
      console.log('Permission request result:', granted);
      if (granted) {
        // Permission was just granted, update the stored state
        await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'true');
        setStoredGranted(true);
        // Trigger a refresh of the permission status
        setRefreshTrigger(prev => prev + 1);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed during permission request', e);
      return false;
    }
  };

  // 更新頻度を制限するための状態
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Memoize the refreshPermissionStatus function so it doesn't change on every render
  const refreshPermissionStatus = useCallback(() => {
    // 既に更新中なら何もしない（重複を防ぐ）
    if (isRefreshing) return;
    
    console.log('Refreshing permission status');
    setIsRefreshing(true);
    
    // 更新をトリガー
    setRefreshTrigger(prev => prev + 1);
    
    // 短い遅延後に更新可能状態に戻す
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [isRefreshing]);

  return {
    // Permissions are considered granted if either native permissions
    // are granted or we have a stored record of previous grant
    permissionsGranted: granted || storedGranted,
    loading: loading || !hasChecked,
    error,
    requestPermissions: handleRequestPermissions,
    clearPermissions: clearStoredPermissions,
    refreshPermissionStatus
  }
}
