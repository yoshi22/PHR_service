import { useState, useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import { useAuth } from './useAuth';
import { fitbitService } from '../services/fitbitService';

interface FitbitData {
  steps: number;
  heartRate: number;
  calories: number;
  distance: number;
  sleepData: SleepData | null;
  activities: ActivityData[];
}

interface SleepData {
  totalMinutesAsleep: number;
  totalTimeInBed: number;
  efficiency: number;
  startTime: Date;
  endTime: Date;
}

interface ActivityData {
  activityName: string;
  duration: number;
  calories: number;
  steps: number;
  startTime: Date;
}

export function useFitbit() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fitbitData, setFitbitData] = useState<FitbitData | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // 初期化時に接続状態を復元
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const restored = await fitbitService.restoreConnection();
        const connectionState = fitbitService.getConnectionState();
        
        setIsConnected(restored);
        setIsAuthorized(connectionState.isAuthorized);
        setLastSyncTime(connectionState.lastSyncTime);
      } catch (err) {
        console.error('Failed to initialize Fitbit connection:', err);
        setError('Fitbit接続の初期化に失敗しました');
      }
    };

    initializeConnection();
  }, []);

  // Deep linking handler for OAuth callback
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      if (url.includes('phrapp://fitbit/callback')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const authCode = urlParams.get('code');
        
        if (authCode) {
          handleAuthCallback(authCode);
        } else {
          const error = urlParams.get('error');
          setError(`認証に失敗しました: ${error || 'Unknown error'}`);
        }
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription?.remove();
  }, []);

  // OAuth認証を開始
  const startAuthentication = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      await fitbitService.startAuthentication();
      // OAuth認証は外部ブラウザで行われるため、ここでは処理を待たない
    } catch (err) {
      setIsLoading(false);
      setError('Fitbit認証の開始に失敗しました: ' + err);
    }
  }, []);

  // OAuth認証コールバックを処理
  const handleAuthCallback = useCallback(async (authCode: string) => {
    setIsLoading(true);

    try {
      const success = await fitbitService.handleAuthCallback(authCode);
      
      if (success) {
        const connectionState = fitbitService.getConnectionState();
        setIsConnected(true);
        setIsAuthorized(true);
        setLastSyncTime(connectionState.lastSyncTime);
        setError(null);
      } else {
        setError('Fitbit認証に失敗しました');
      }
    } catch (err) {
      setError('認証処理中にエラーが発生しました: ' + err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fitbitデータを同期
  const syncFitbitData = useCallback(async () => {
    if (!isConnected) {
      setError('Fitbitが接続されていません');
      return null;
    }

    setError(null);
    setIsLoading(true);

    try {
      const data = await fitbitService.syncFitbitData();
      setFitbitData(data);
      setLastSyncTime(new Date());
      setIsLoading(false);
      
      return data;
    } catch (err) {
      setIsLoading(false);
      setError('Fitbitデータの同期に失敗しました: ' + err);
      return null;
    }
  }, [isConnected]);

  // 接続を切断
  const disconnect = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      await fitbitService.disconnect();
      setIsConnected(false);
      setIsAuthorized(false);
      setFitbitData(null);
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
      const restored = await fitbitService.restoreConnection();
      const connectionState = fitbitService.getConnectionState();
      
      setIsConnected(restored);
      setIsAuthorized(connectionState.isAuthorized);
      setLastSyncTime(connectionState.lastSyncTime);
    } catch (err) {
      console.error('Failed to refresh Fitbit connection state:', err);
    }
  }, []);

  // 睡眠データの要約を取得
  const getSleepSummary = useCallback(() => {
    if (!fitbitData?.sleepData) return null;

    const sleepData = fitbitData.sleepData;
    const hoursAsleep = Math.floor(sleepData.totalMinutesAsleep / 60);
    const minutesAsleep = sleepData.totalMinutesAsleep % 60;

    return {
      duration: `${hoursAsleep}時間${minutesAsleep}分`,
      efficiency: `${sleepData.efficiency}%`,
      quality: sleepData.efficiency >= 85 ? 'Good' : sleepData.efficiency >= 70 ? 'Fair' : 'Poor',
    };
  }, [fitbitData]);

  // 今日のアクティビティサマリーを取得
  const getActivitySummary = useCallback(() => {
    if (!fitbitData) return null;

    return {
      steps: fitbitData.steps,
      calories: fitbitData.calories,
      distance: fitbitData.distance,
      activeMinutes: fitbitData.activities.reduce((total, activity) => total + activity.duration, 0),
      workouts: fitbitData.activities.length,
    };
  }, [fitbitData]);

  return {
    // 状態
    isConnected,
    isAuthorized,
    isLoading,
    error,
    fitbitData,
    lastSyncTime,
    
    // アクション
    startAuthentication,
    syncFitbitData,
    disconnect,
    refreshConnectionState,
    
    // ヘルパー関数
    getSleepSummary,
    getActivitySummary,
    
    // プラットフォーム情報
    isSupported: true, // Fitbitはクロスプラットフォーム対応
  };
}
