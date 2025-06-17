import * as React from 'react';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { useAuth } from './useAuth';
import * as miBandService from '../services/miBandService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { useState, useEffect, useCallback } = React;

export function useMiBand() {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [steps, setSteps] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // BLEアクセス許可を確認（Android/iOS対応）
  const checkPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        console.log('🔍 Checking Android Bluetooth permissions...');
        
        // Android APIレベルに応じた権限リスト
        const permissions: string[] = [];
        
        // 基本的な位置情報権限（BLE必須）
        permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        
        // Android 12以降の新しいBluetooth権限
        if (Platform.Version >= 31) {
          permissions.push(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
          );
        } else {
          // Android 11以前の従来のBluetooth権限
          permissions.push(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN
          );
        }
        
        console.log('📋 Requesting permissions:', permissions);
        
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        console.log('✅ Permission results:', granted);
        
        // 結果を詳細にチェック
        const deniedPermissions: string[] = [];
        
        Object.entries(granted).forEach(([permission, status]) => {
          if (status !== PermissionsAndroid.RESULTS.GRANTED) {
            deniedPermissions.push(permission);
          }
        });
        
        if (deniedPermissions.length > 0) {
          const errorMsg = `以下の権限が許可されていません:\n${deniedPermissions.join('\n')}\n\n設定アプリでBluetooth権限を許可してください。`;
          setError(errorMsg);
          
          // ユーザーに設定画面への誘導を提案
          Alert.alert(
            '権限が必要です',
            errorMsg,
            [
              { text: 'キャンセル', style: 'cancel' },
              { 
                text: '設定を開く', 
                onPress: () => {
                  // TODO: 設定画面を開く実装を追加
                  console.log('Open settings requested');
                }
              }
            ]
          );
          
          return false;
        }
        
        console.log('✅ All Android permissions granted');
        return true;
        
      } catch (err) {
        const errorMsg = `権限リクエストエラー: ${err}`;
        console.error('❌ Permission request failed:', err);
        setError(errorMsg);
        return false;
      }
    } else if (Platform.OS === 'ios') {
      console.log('📱 iOS - Bluetooth permissions are handled by the system');
      // iOSでは権限はBLEManager初期化時に自動処理される
      return true;
    } else {
      console.log('⚠️ Unsupported platform for Bluetooth:', Platform.OS);
      setError('このプラットフォームではBluetoothはサポートされていません。');
      return false;
    }
  }, []);

  // 最後の同期時間を読み込む
  useEffect(() => {
    const loadLastSyncTime = async () => {
      try {
        const savedTime = await AsyncStorage.getItem('mibandLastSync');
        if (savedTime) {
          setLastSyncTime(new Date(savedTime));
        }
      } catch (e) {
        console.error('Failed to load last sync time:', e);
      }
    };

    loadLastSyncTime();
  }, []);

  // Mi Bandをスキャン（改善版）
  const startScan = useCallback(async () => {
    console.log('🔍 Starting MiBand scan...');
    setError(null);
    
    // 権限チェック
    if (!(await checkPermissions())) {
      console.error('❌ Permissions not granted');
      return null;
    }

    try {
      setIsScanning(true);
      
      console.log('📡 Initializing BLE manager...');
      // BLEマネージャーを初期化
      miBandService.initializeBLE();
      
      // BLE初期化の待機時間を延長
      console.log('⏳ Waiting for BLE initialization...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Bluetooth状態を複数回確認
      let bluetoothState = 'Unknown';
      let retryCount = 0;
      const maxRetries = 3;
      
      while (bluetoothState !== 'PoweredOn' && retryCount < maxRetries) {
        console.log(`📶 Checking Bluetooth state (attempt ${retryCount + 1}/${maxRetries})...`);
        bluetoothState = await miBandService.checkBluetoothState();
        
        if (bluetoothState !== 'PoweredOn') {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`⏳ Bluetooth not ready (${bluetoothState}), retrying in 1s...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (bluetoothState !== 'PoweredOn') {
        setIsScanning(false);
        const stateMessage = bluetoothState === 'Unknown' 
          ? 'Bluetooth状態を確認できません' 
          : `Bluetooth状態: ${bluetoothState}`;
        const errorMsg = `${stateMessage}\\n\\n以下を確認してください:\\n• 設定でBluetoothを有効にする\\n• アプリを再起動する\\n• デバイスを再起動する`;
        setError(errorMsg);
        return null;
      }

      console.log('✅ Bluetooth is ready, starting device scan...');
      
      // まず保存されたデバイスで再接続を試行
      const foundDevice = await miBandService.scanForMiBandWithRetry();
      setIsScanning(false);
      
      if (foundDevice) {
        console.log('✅ MiBand found:', foundDevice.name || foundDevice.id);
        setDevice(foundDevice);
        return foundDevice;
      } else {
        const troubleshootingMsg = `Mi Bandが見つかりませんでした。\\n\\n以下を確認してください:\\n• Mi Bandが近くにある（1-2m以内）\\n• Mi Bandの画面を点灯させる\\n• 他のデバイスとの接続を切断する\\n• Mi Bandを再起動する\\n• しばらく待ってから再試行する`;
        console.log('❌ MiBand not found');
        setError(troubleshootingMsg);
        return null;
      }
    } catch (e) {
      setIsScanning(false);
      const errorMsg = `スキャンエラー: ${e}\\n\\nトラブルシューティング:\\n• アプリの権限を確認\\n• Bluetoothを再起動\\n• アプリを再起動`;
      console.error('❌ Scan error:', e);
      setError(errorMsg);
      return null;
    }
  }, [checkPermissions]);

  // Mi Bandに接続（改善版）
  const connect = useCallback(async (deviceToConnect?: Device) => {
    const targetDevice = deviceToConnect || device;
    if (!targetDevice) {
      setError('接続するデバイスがありません。先にデバイスをスキャンしてください。');
      return false;
    }

    console.log(`🔗 Attempting to connect to: ${targetDevice.name || targetDevice.id}`);

    try {
      setError(null);
      setIsConnecting(true);
      
      // 接続前にBluetooth状態を再確認
      console.log('📶 Checking Bluetooth state before connection...');
      const bluetoothState = await miBandService.checkBluetoothState();
      if (bluetoothState !== 'PoweredOn') {
        setIsConnecting(false);
        const errorMsg = `Bluetooth接続できません: ${bluetoothState}\\n\\n設定でBluetoothを有効にしてから再試行してください。`;
        setError(errorMsg);
        return false;
      }
      
      console.log('✅ Bluetooth ready, attempting connection...');
      const connected = await miBandService.connectToMiBand(targetDevice);
      setIsConnecting(false);

      if (connected) {
        console.log('✅ Successfully connected to MiBand');
        setIsConnected(true);
        
        // 接続成功時にデバイスIDを保存
        try {
          await AsyncStorage.setItem('mibandDeviceId', targetDevice.id);
          console.log('💾 Device ID saved for future connections');
        } catch (saveError) {
          console.warn('⚠️ Failed to save device ID:', saveError);
        }
        
        return true;
      } else {
        const errorMsg = `デバイスへの接続に失敗しました。\\n\\n以下を確認してください:\\n• Mi Bandが近くにある\\n• Mi Bandが他のデバイスと接続していない\\n• Mi Bandの画面を点灯させる\\n• しばらく待ってから再試行する`;
        console.log('❌ Connection failed');
        setError(errorMsg);
        return false;
      }
    } catch (e) {
      setIsConnecting(false);
      const errorMessage = e instanceof Error ? e.message : String(e);
      const errorMsg = `接続エラー: ${errorMessage}\\n\\nトラブルシューティング:\\n• Bluetoothを再起動する\\n• アプリを再起動する\\n• Mi Bandを再起動する`;
      console.error('❌ Connection error:', e);
      setError(errorMsg);
      return false;
    }
  }, [device]);

  // 心拍数のモニタリングを開始
  const startHeartRateMonitoring = useCallback(async () => {
    if (!device || !isConnected) {
      setError('デバイスが接続されていません。');
      return false;
    }

    try {
      const success = await miBandService.startHeartRateMonitoring(device, (rate) => {
        setHeartRate(rate);
        if (user && user.uid) {
          miBandService.saveHealthData(user.uid, { heartRate: rate });
        }
      });

      if (!success) {
        setError('心拍数モニタリングの開始に失敗しました。');
      }
      return success;
    } catch (e) {
      setError('心拍数モニタリングエラー: ' + e);
      return false;
    }
  }, [device, isConnected, user]);

  // 歩数データを同期
  const syncStepsData = useCallback(async () => {
    if (!device || !isConnected) {
      setError('デバイスが接続されていません。');
      return false;
    }

    if (!user || !user.uid) {
      setError('ユーザーがログインしていません。');
      return false;
    }

    try {
      const stepsCount = await miBandService.fetchStepsData(device);
      
      if (stepsCount !== null) {
        setSteps(stepsCount);
        
        // Firestoreにデータを保存
        await miBandService.saveHealthData(user.uid, { steps: stepsCount });
        
        // 最後の同期時間を保存
        const now = new Date();
        setLastSyncTime(now);
        await AsyncStorage.setItem('mibandLastSync', now.toISOString());
        
        return true;
      } else {
        setError('歩数データの取得に失敗しました。');
        return false;
      }
    } catch (e) {
      setError('データ同期エラー: ' + e);
      return false;
    }
  }, [device, isConnected, user]);

  // Mi Bandを切断
  const disconnect = useCallback(async () => {
    try {
      await miBandService.disconnectMiBand();
      setIsConnected(false);
      return true;
    } catch (e) {
      setError('切断エラー: ' + e);
      return false;
    }
  }, []);

  // コンポーネントのアンマウント時にBLE接続をクリーンアップ
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

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
    disconnect,
  };
}
