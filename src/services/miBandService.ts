import { Platform } from 'react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Mi Band のサービスとキャラクタリスティックUUID
// Note: これらのUUIDは Mi Band のバージョンによって異なる場合があります
const SERVICE_UUID = {
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  FITNESS: '0000183e-0000-1000-8000-00805f9b34fb',
  ACTIVITY: '0000fedd-0000-1000-8000-00805f9b34fb', // Mi Band 特有
};

const CHARACTERISTIC_UUID = {
  HEART_RATE: '00002a37-0000-1000-8000-00805f9b34fb',
  STEPS: '00002a53-0000-1000-8000-00805f9b34fb',
  ACTIVITY_DATA: '0000fed9-0000-1000-8000-00805f9b34fb', // Mi Band 特有
};

// Mi Band からのデータ型
export type HealthData = {
  userId: string;
  timestamp: Timestamp;
  heartRate?: number;
  steps?: number;
  distance?: number;
  calories?: number;
  sleep?: {
    deepSleepMinutes: number;
    lightSleepMinutes: number;
    remSleepMinutes?: number;
    awakeMinutes: number;
  };
  source: 'miband'; // データソースを明示
};

let bleManager: BleManager | null = null;
let connectedDevice: Device | null = null;

// BLE Managerの初期化
export const initializeBLE = (): BleManager => {
  if (!bleManager) {
    bleManager = new BleManager();
  }
  return bleManager;
};

// Mi Bandを検索する
export const scanForMiBand = async (): Promise<Device | null> => {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    console.warn('BLE scanning is only supported on iOS and Android');
    return null;
  }

  const manager = initializeBLE();

  // 保存されたデバイスIDがあれば取得
  const savedDeviceId = await AsyncStorage.getItem('mibandDeviceId');

  return new Promise((resolve, reject) => {
    let subscription: any = null;
    
    try {
      // 以前に接続したデバイスIDがあれば、その特定のデバイスをスキャンする
      subscription = manager.startDeviceScan(
        savedDeviceId ? null : ['0000fedd-0000-1000-8000-00805f9b34fb'], 
        null,
        (error, device) => {
          if (error) {
            console.error('Device scan error:', error);
            reject(error);
            return;
          }

          // Mi Band またはHuami（Xiaoimiの親会社）のデバイスを探す
          if (device && (
                device.name?.toLowerCase().includes('mi band') || 
                device.name?.toLowerCase().includes('miband') || 
                device.name?.toLowerCase().includes('huami') ||
                (savedDeviceId && device.id === savedDeviceId)
              )) {
            if (subscription) {
              subscription.remove();
            }
            manager.stopDeviceScan();
            console.log('Found Mi Band:', device.name, device.id);
            resolve(device);
          }
        }
      );

      // 15秒後にタイムアウト
      setTimeout(() => {
        if (subscription) {
          subscription.remove();
        }
        manager.stopDeviceScan();
        console.log('Scan timed out');
        resolve(null);
      }, 15000);
    } catch (e) {
      console.error('Error starting scan:', e);
      reject(e);
    }
  });
};

// Mi Bandに接続
export const connectToMiBand = async (device: Device): Promise<boolean> => {
  try {
    const manager = initializeBLE();

    console.log(`Connecting to ${device.name} (${device.id})...`);
    const connectedDevice = await device.connect();
    console.log('Connected, discovering services...');
    
    await connectedDevice.discoverAllServicesAndCharacteristics();
    console.log('Services discovered');

    // デバイスIDを保存
    await AsyncStorage.setItem('mibandDeviceId', device.id);
    
    return true;
  } catch (error) {
    console.error('Connection error:', error);
    return false;
  }
};

// 心拍数データのモニタリングを開始
export const startHeartRateMonitoring = async (device: Device, onHeartRateUpdate: (heartRate: number) => void) => {
  try {
    await device.monitorCharacteristicForService(
      SERVICE_UUID.HEART_RATE,
      CHARACTERISTIC_UUID.HEART_RATE,
      (error, characteristic) => {
        if (error) {
          console.error('Heart rate monitoring error:', error);
          return;
        }

        if (characteristic?.value) {
          // heart rateデータの解析（オクテットの2番目の値が心拍数）
          const buffer = Buffer.from(characteristic.value, 'base64');
          // 心拍数計測フラグとフォーマット確認
          const heartRate = buffer[1];
          onHeartRateUpdate(heartRate);
        }
      }
    );

    console.log('Started heart rate monitoring');
    return true;
  } catch (error) {
    console.error('Failed to start heart rate monitoring:', error);
    return false;
  }
};

// Mi Bandからの健康データをFirestoreに保存
export const saveHealthData = async (userId: string, data: Partial<HealthData>) => {
  try {
    const db = getFirestore();
    const healthData: HealthData = {
      userId,
      timestamp: Timestamp.now(),
      source: 'miband',
      ...data
    };

    await addDoc(collection(db, 'healthData'), healthData);
    console.log('Health data saved to Firestore');
    return true;
  } catch (error) {
    console.error('Failed to save health data:', error);
    return false;
  }
};

// 歩数データを取得
export const fetchStepsData = async (device: Device): Promise<number | null> => {
  try {
    const characteristic = await device.readCharacteristicForService(
      SERVICE_UUID.FITNESS,
      CHARACTERISTIC_UUID.STEPS
    );

    if (characteristic?.value) {
      const buffer = Buffer.from(characteristic.value, 'base64');
      // バイナリデータからステップカウントを解析 (仕様に応じて実装)
      // Mi Bandの実際の仕様に合わせて調整が必要
      const steps = buffer.readUInt16LE(1);
      return steps;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch steps data:', error);
    return null;
  }
};

// Mi Bandの接続を解除
export const disconnectMiBand = async () => {
  if (connectedDevice) {
    try {
      await connectedDevice.cancelConnection();
      connectedDevice = null;
      return true;
    } catch (error) {
      console.error('Disconnect error:', error);
      return false;
    }
  }
  return true;
};

// アプリケーションが終了するときに呼び出す
export const cleanupBLE = () => {
  if (bleManager) {
    bleManager.destroy();
    bleManager = null;
  }
};
