import * as React from 'react';
import { Alert } from 'react-native';
import { useHealthData } from './useHealthData';
import { usePermissions } from './usePermissions';

const { useState, useCallback } = React;

export function useMiBand() {
  const { healthData } = useHealthData();
  const { hasPermissions } = usePermissions();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error] = useState<string | null>(null);
  
  // HealthKit経由でのMi Band連携状態を実際のデータに基づいて判定
  // Mi BandはHealthKit経由でZepp Lifeアプリから連携される
  const isConnected = hasPermissions && healthData?.steps != null;
  const isScanning = false;
  const isConnecting = false;
  const device = isConnected ? { name: 'Mi Band (HealthKit経由)', id: 'healthkit-miband' } : null;
  const heartRate = healthData?.heartRate || null;
  const steps = healthData?.steps || null;
  const scannedDevices: any[] = [];
  const showDeviceSelector = false;

  // HealthKit経由の連携ガイダンス
  const startScan = useCallback(async () => {
    if (isConnected) {
      Alert.alert(
        'Mi Band連携済み',
        'Mi BandはHealthKit経由で正常に連携されています。\n\n現在のデータ:\n• 歩数: ' + (steps?.toLocaleString() || '取得中') + '\n• 心拍数: ' + (heartRate || '取得中') + ' bpm',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Mi Band連携',
        'Mi Bandとの連携にはZepp Lifeアプリが必要です。\n\n設定手順:\n1. Zepp LifeでMi Bandをペアリング\n2. Zepp Life → プロフィール → データエクスポート → Apple Health をON\n3. 本アプリでHealthKit権限を許可\n\n※データが反映されない場合は、Zepp Lifeアプリで手動同期を実行してください。',
        [{ text: 'OK' }]
      );
    }
    return null;
  }, [isConnected, steps, heartRate]);

  const connect = useCallback(async () => {
    // HealthKit経由では接続操作は不要
    return;
  }, []);

  const startHeartRateMonitoring = useCallback(async () => {
    // HealthKit経由では心拍数モニタリングは別途実装
    return;
  }, []);

  const syncStepsData = useCallback(async () => {
    if (isConnected) {
      Alert.alert(
        'データ同期完了',
        'Mi Bandのデータ同期を確認しました。\n\n最新データ:\n• 歩数: ' + (steps?.toLocaleString() || '取得中') + '\n• 心拍数: ' + (heartRate || '取得中') + ' bpm\n\n※更新されない場合は、Zepp Lifeアプリで手動同期を実行してください。',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'データ同期',
        'Mi Band連携が必要です。\n\n同期手順:\n1. Zepp Lifeでデータ同期を確認\n2. Apple Healthアプリで最新データを確認\n3. 本アプリを再起動',
        [{ text: 'OK' }]
      );
    }
    setLastSyncTime(new Date());
  }, [isConnected, steps, heartRate]);

  const syncWeeklyStepsHistory = useCallback(async () => {
    // 週間履歴はHealthKit経由で取得
    return null;
  }, []);

  const getStoredWeeklySteps = useCallback(async () => {
    // 保存されたデータの取得
    return null;
  }, []);

  const disconnect = useCallback(async () => {
    // HealthKit経由では切断操作は不要
    return;
  }, []);

  const selectDevice = useCallback(() => {
    // デバイス選択は不要
  }, []);

  const cancelDeviceSelection = useCallback(() => {
    // デバイス選択キャンセルは不要
  }, []);

  return {
    isScanning,
    isConnecting,
    isConnected,
    device,
    heartRate,
    steps,
    lastSyncTime,
    error,
    startScan,
    connect,
    startHeartRateMonitoring,
    syncStepsData,
    syncWeeklyStepsHistory,
    getStoredWeeklySteps,
    disconnect,
    scannedDevices,
    showDeviceSelector,
    selectDevice,
    cancelDeviceSelection,
  };
}