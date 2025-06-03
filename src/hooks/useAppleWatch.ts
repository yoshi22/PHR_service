import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './useAuth';
import { appleWatchService } from '../services/appleWatchService';

interface HealthKitData {
  steps: number;
  heartRate: number;
  calories: number;
  distance: number;
  workouts: WorkoutData[];
}

interface WorkoutData {
  type: string;
  duration: number;
  calories: number;
  startDate: Date;
  endDate: Date;
}

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
      if (Platform.OS !== 'ios') {
        setError('Apple Watch integration is only available on iOS');
        return;
      }

      try {
        const connected = await appleWatchService.checkConnection();
        const connectionState = appleWatchService.getConnectionState();
        
        setIsConnected(connected);
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
    if (Platform.OS !== 'ios') {
      setError('Apple Watch integration is only available on iOS');
      return false;
    }

    setError(null);
    setIsLoading(true);

    try {
      const authorized = await appleWatchService.requestHealthKitPermissions();
      setIsAuthorized(authorized);
      setIsConnected(authorized);
      setIsLoading(false);
      
      if (!authorized) {
        setError('HealthKit権限が許可されませんでした');
      }

      return authorized;
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
      const data = await appleWatchService.syncHealthData();
      setHealthData(data);
      setLastSyncTime(new Date());
      setIsLoading(false);
      
      return data;
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
      const workouts = await appleWatchService.getWorkouts(startDate, endDate);
      return workouts;
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
      await appleWatchService.disconnect();
      setIsConnected(false);
      setIsAuthorized(false);
      setHealthData(null);
      setLastSyncTime(null);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError('切断に失敗しました: ' + err);
    }
  }, []);

  // 接続状態を更新
  const refreshConnectionState = useCallback(async () => {
    try {
      const connected = await appleWatchService.checkConnection();
      const connectionState = appleWatchService.getConnectionState();
      
      setIsConnected(connected);
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
