import { useState, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { useAuth } from './useAuth';
import * as miBandService from '../services/miBandService';
import * as miBandDebugService from '../services/miBandService_debug';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // BLEアクセス許可を確認（Android用）
  const checkPermissions = useCallback(async () => {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          'android.permission.BLUETOOTH_SCAN',
          'android.permission.BLUETOOTH_CONNECT',
        ]);
        
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          setError('一部のBluetooth権限が許可されていません。');
          return false;
        }
        return true;
      } catch (err) {
        setError('権限リクエストエラー: ' + err);
        return false;
      }
    }
    return true;
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

  // デバッグ用: 全デバイススキャン
  const startDebugScan = useCallback(async () => {
    setError(null);
    
    if (!(await checkPermissions())) {
      return;
    }

    try {
      setIsScanning(true);
      
      // デバッグサービスを使用して包括的スキャン
      const foundDevice = await miBandDebugService.scanForMiBandImproved();
      setIsScanning(false);

      if (foundDevice) {
        console.log('Debug scan found device:', foundDevice.name, foundDevice.id);
        setDevice(foundDevice);
        return foundDevice;
      } else {
        setError('デバッグスキャンでもMi Bandが見つかりませんでした。周辺のすべてのBLEデバイスをログで確認してください。');
        return null;
      }
    } catch (e) {
      setIsScanning(false);
      setError('デバッグスキャンエラー: ' + e);
      return null;
    }
  }, [checkPermissions]);

  // Mi Bandをスキャン
  const startScan = useCallback(async () => {
    setError(null);
    
    if (!(await checkPermissions())) {
      return;
    }

    try {
      setIsScanning(true);
      
      // BLEマネージャーを初期化
      miBandService.initializeBLE();
      
      // 少し待ってからBluetooth状態を確認
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Bluetooth状態を確認
      const bluetoothState = await miBandService.checkBluetoothState();
      console.log('Bluetooth state before scan:', bluetoothState);
      
      if (bluetoothState !== 'PoweredOn') {
        setIsScanning(false);
        const stateMessage = bluetoothState === 'Unknown' 
          ? 'Bluetooth状態を確認できません' 
          : `Bluetooth状態: ${bluetoothState}`;
        setError(`${stateMessage}. 設定でBluetoothを有効にしてください。`);
        return null;
      }

      // まず通常のスキャンを試行
      const foundDevice = await miBandService.scanForMiBand();
      
      if (!foundDevice) {
        console.log('通常スキャンで見つからなかったため、デバッグスキャンを実行...');
        // 通常スキャンで見つからない場合、デバッグスキャンを実行
        const debugFoundDevice = await miBandDebugService.scanForMiBandImproved();
        setIsScanning(false);
        
        if (debugFoundDevice) {
          setDevice(debugFoundDevice);
          return debugFoundDevice;
        } else {
          setError('Mi Bandが見つかりませんでした。Mi Bandがペアリングモードになっているか、近くにあることを確認してください。');
          return null;
        }
      } else {
        setIsScanning(false);
        setDevice(foundDevice);
        return foundDevice;
      }
    } catch (e) {
      setIsScanning(false);
      setError('スキャンエラー: ' + e);
      return null;
    }
  }, [checkPermissions]);

  // Mi Bandに接続
  const connect = useCallback(async (deviceToConnect?: Device) => {
    const targetDevice = deviceToConnect || device;
    if (!targetDevice) {
      setError('接続するデバイスがありません。');
      return false;
    }

    try {
      setError(null);
      setIsConnecting(true);
      
      // 接続前にBluetooth状態を再確認
      const bluetoothState = await miBandService.checkBluetoothState();
      if (bluetoothState !== 'PoweredOn') {
        setIsConnecting(false);
        setError(`Bluetooth接続できません: ${bluetoothState}`);
        return false;
      }
      
      const connected = await miBandService.connectToMiBand(targetDevice);
      setIsConnecting(false);

      if (connected) {
        setIsConnected(true);
        return true;
      } else {
        setError('デバイスへの接続に失敗しました。');
        return false;
      }
    } catch (e) {
      setIsConnecting(false);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError('接続エラー: ' + errorMessage);
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
    startDebugScan, // デバッグ機能を追加
    connect,
    startHeartRateMonitoring,
    syncStepsData,
    disconnect,
  };
}
