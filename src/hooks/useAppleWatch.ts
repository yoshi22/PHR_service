import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { appleWatchService, HealthKitData, WorkoutData } from '../services/appleWatchService';
import { ServiceResult } from '../services/types';

// Types are now imported from the service

export function useAppleWatch() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<HealthKitData | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // 初期化時に接続状態を確認
  useEffect(() => {
    const initializeConnection = async () => {
      if (!appleWatchService.isSupported()) {
        setError('Apple Watch integration is only available on iOS');
        return;
      }

      try {
        const connectionResult = await appleWatchService.checkConnection();
        if (connectionResult.success && connectionResult.data !== undefined) {
          setIsConnected(connectionResult.data);
        }
        
        const connectionState = appleWatchService.getConnectionState();
        setIsAuthorized(connectionState.isAuthorized);
        setLastSyncTime(connectionState.lastSyncTime);
      } catch (err) {
        console.error('Failed to initialize Apple Watch connection:', err);
        setError('Apple Watch接続の初期化に失敗しました');
      }
    };

    initializeConnection();
  }, []);

  // HealthKit権限をリクエスト
  const requestPermissions = useCallback(async () => {
    if (!appleWatchService.isSupported()) {
      setError('Apple Watch integration is only available on iOS');
      return false;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await appleWatchService.requestPermissions();
      setIsLoading(false);
      
      if (result.success && result.data !== undefined) {
        setIsAuthorized(result.data);
        setIsConnected(result.data);
        
        if (!result.data) {
          setError('HealthKit権限が許可されませんでした');
        }
        
        return result.data;
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || 'HealthKit権限のリクエストに失敗しました';
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      setIsLoading(false);
      setError('HealthKit権限のリクエストに失敗しました: ' + err);
      return false;
    }
  }, []);

  // ヘルスデータを同期
  const syncHealthData = useCallback(async () => {
    if (!isConnected) {
      setError('Apple Watchが接続されていません');
      return null;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await appleWatchService.syncHealthData();
      setIsLoading(false);
      
      if (result.success && result.data) {
        setHealthData(result.data);
        setLastSyncTime(new Date());
        return result.data;
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || 'ヘルスデータの同期に失敗しました';
        setError(errorMessage);
        return null;
      }
    } catch (err) {
      setIsLoading(false);
      setError('ヘルスデータの同期に失敗しました: ' + err);
      return null;
    }
  }, [isConnected]);

  // ワークアウトデータを取得
  const getWorkouts = useCallback(async (startDate: Date, endDate: Date): Promise<WorkoutData[]> => {
    if (!isConnected) {
      setError('Apple Watchが接続されていません');
      return [];
    }

    setError(null);

    try {
      const result = await appleWatchService.getWorkouts(startDate, endDate);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || 'ワークアウトデータの取得に失敗しました';
        setError(errorMessage);
        return [];
      }
    } catch (err) {
      setError('ワークアウトデータの取得に失敗しました: ' + err);
      return [];
    }
  }, [isConnected]);

  // 接続を切断
  const disconnect = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await appleWatchService.disconnect();
      setIsLoading(false);
      
      if (result.success) {
        setIsConnected(false);
        setIsAuthorized(false);
        setHealthData(null);
        setLastSyncTime(null);
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || '切断に失敗しました';
        setError(errorMessage);
      }
    } catch (err) {
      setIsLoading(false);
      setError('切断に失敗しました: ' + err);
    }
  }, []);

  // 接続状態を更新
  const refreshConnectionState = useCallback(async () => {
    try {
      const connectionResult = await appleWatchService.checkConnection();
      if (connectionResult.success && connectionResult.data !== undefined) {
        setIsConnected(connectionResult.data);
      }
      
      const connectionState = appleWatchService.getConnectionState();
      setIsAuthorized(connectionState.isAuthorized);
      setLastSyncTime(connectionState.lastSyncTime);
    } catch (err) {
      console.error('Failed to refresh Apple Watch connection state:', err);
    }
  }, []);

  return {
    // 状態
    isConnected,
    isAuthorized,
    isLoading,
    error,
    healthData,
    lastSyncTime,
    
    // アクション
    requestPermissions,
    syncHealthData,
    getWorkouts,
    disconnect,
    refreshConnectionState,
    
    // プラットフォーム情報
    isSupported: appleWatchService.isSupported(),
  };
}
