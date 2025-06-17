import { Platform } from 'react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Mi Band のサービスとキャラクタリスティックUUID
const SERVICE_UUID = {
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  FITNESS: '0000183e-0000-1000-8000-00805f9b34fb',
  ACTIVITY: '0000fedd-0000-1000-8000-00805f9b34fb',
};

const CHARACTERISTIC_UUID = {
  HEART_RATE: '00002a37-0000-1000-8000-00805f9b34fb',
  STEPS: '00002a53-0000-1000-8000-00805f9b34fb',
  ACTIVITY_DATA: '0000fed9-0000-1000-8000-00805f9b34fb',
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
  source: 'miband';
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

// Bluetooth状態を確認
export const checkBluetoothState = async (): Promise<string> => {
  const manager = initializeBLE();
  try {
    const state = await manager.state();
    
    // 状態を正規化
    switch (state) {
      case 'PoweredOn':
        return 'PoweredOn';
      case 'PoweredOff':
        return 'PoweredOff';
      case 'Resetting':
        return 'Resetting';
      case 'Unauthorized':
        return 'Unauthorized';
      case 'Unsupported':
        return 'Unsupported';
      case 'Unknown':
      default:
        // Unknownの場合、少し待ってから再試行
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryState = await manager.state();
        return retryState;
    }
  } catch (error) {
    console.error('Failed to check Bluetooth state:', error);
    return 'Unknown';
  }
};

// Mi Bandを検索する（リトライ機能付き）
export const scanForMiBandWithRetry = async (maxRetries: number = 2): Promise<Device | null> => {
  console.log(`🔍 Starting MiBand scan with retry (max ${maxRetries} attempts)...`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📡 Scan attempt ${attempt}/${maxRetries}`);
    
    try {
      const device = await scanForMiBand(15000 + (attempt * 5000)); // スキャン時間を段階的に延長
      if (device) {
        console.log(`✅ Device found on attempt ${attempt}: ${device.name || device.id}`);
        return device;
      }
    } catch (error) {
      console.warn(`⚠️ Scan attempt ${attempt} failed:`, error);
    }
    
    // 最後の試行でなければ待機
    if (attempt < maxRetries) {
      console.log(`⏳ Waiting 2s before retry...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('❌ All scan attempts failed');
  return null;
};

// Mi Bandを検索する（Promise版）
export const scanForMiBand = async (scanTimeout: number = 10000): Promise<Device | null> => {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    console.warn('BLE scanning is only supported on iOS and Android');
    return null;
  }

  const manager = initializeBLE();
  const state = await checkBluetoothState();
  if (state !== 'PoweredOn') {
    throw new Error(`Bluetooth is not ready. Current state: ${state}`);
  }

  const savedDeviceId = await AsyncStorage.getItem('mibandDeviceId');

  return new Promise((resolve, reject) => {
    let subscription: any = null;
    let scanTimeoutHandle: NodeJS.Timeout;
    const targetServices = ['FEE0', 'FEE1', 'FE95', '180D', '180F', '1800', '1801', '181C'];

    const stopScan = () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
      manager.stopDeviceScan();
      if (scanTimeoutHandle) clearTimeout(scanTimeoutHandle);
    };

    try {
      console.log(`📡 Starting BLE scan for ${scanTimeout}ms...`);
      
      subscription = manager.startDeviceScan(
        null, // Scan all services for better compatibility
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('❌ Device scan error:', error);
            stopScan();
            reject(error);
            return;
          }
          if (!device) return;

          const name = (device.name || '').toLowerCase();
          const advServices = device.serviceUUIDs || [];
          const manufacturerData = device.manufacturerData;
          
          console.log(`🔍 Found device: ${device.name || 'Unknown'} (${device.id}) with services: ${advServices.join(', ')}`);
          
          // より包括的なMi Band検出ロジック
          const hasMiService = advServices.some(u => {
            const cleanUuid = u.replace(/-/g, '').toUpperCase();
            return targetServices.includes(cleanUuid);
          });
          
          // 名前による検出（より柔軟な条件）
          const isMiBandByName = name.includes('mi') ||
                                name.includes('band') || 
                                name.includes('xiaomi') ||
                                name.includes('huami') ||
                                name.includes('amazfit') ||
                                name.includes('mili') ||
                                name.includes('redmi') ||
                                name.includes('fitness') ||
                                name.includes('watch') ||
                                name.includes('tracker');
          
          // 製造者データによる検出
          const isMiBandByManufacturer = manufacturerData && (
            manufacturerData.includes('157') || 
            manufacturerData.includes('27d') ||
            manufacturerData.includes('343') ||
            manufacturerData.includes('637')
          );
          
          // 保存されたデバイスIDとの一致
          const isSavedDevice = savedDeviceId && device.id === savedDeviceId;
          
          // Heart Rateサービスを持つデバイス（フィットネストラッカーの可能性が高い）
          const hasHeartRateService = advServices.some(u => 
            u.toLowerCase().includes('180d') || u.toLowerCase().includes('0000180d')
          );
          
          // バッテリーサービスを持つデバイス
          const hasBatteryService = advServices.some(u => 
            u.toLowerCase().includes('180f') || u.toLowerCase().includes('0000180f')
          );
          
          // より広範囲のマッチング条件
          const isLikelyMiBand = isMiBandByName || 
                               hasMiService || 
                               isMiBandByManufacturer || 
                               isSavedDevice ||
                               (hasHeartRateService && hasBatteryService) ||
                               (hasHeartRateService && (name.includes('band') || name.includes('fit') || name.includes('mi')));
          
          if (isLikelyMiBand) {
            console.log(`✅ Potential MiBand detected: ${device.name || device.id}`);
            console.log(`   - Name match: ${isMiBandByName}`);
            console.log(`   - Service match: ${hasMiService}`);
            console.log(`   - Manufacturer match: ${isMiBandByManufacturer}`);
            console.log(`   - Saved device: ${isSavedDevice}`);
            console.log(`   - Heart rate service: ${hasHeartRateService}`);
            
            stopScan();
            resolve(device);
          }
        }
      );

      scanTimeoutHandle = setTimeout(() => {
        console.log(`⏰ Scan timeout after ${scanTimeout}ms`);
        stopScan();
        resolve(null);
      }, scanTimeout);

    } catch (err) {
      console.error('❌ Failed to start scan:', err);
      stopScan();
      reject(err);
    }
  });
};

// Mi Bandを検索する（コールバック版）- 要件に従った新実装
export async function scanForMiBandWithCallback(
  onFound: (device: Device) => void
): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    console.warn('BLE scanning is only supported on iOS and Android');
    return;
  }

  const manager = initializeBLE();
  
  // Bluetooth状態チェック
  const state = await checkBluetoothState();
  if (state !== 'PoweredOn') {
    console.warn(`Bluetooth is not ready. Current state: ${state}`);
    return;
  }

  let subscription: any = null;
  let scanTimeout: NodeJS.Timeout;
  
  // Mi Band特有のサービスUUID
  const MI_BAND_SERVICE_UUID = '0000fee0-0000-1000-8000-00805f9b34fb';
  
  const stopScan = () => {
    if (subscription && typeof subscription.remove === 'function') {
      subscription.remove();
    }
    manager.stopDeviceScan();
    subscription = null;
    if (scanTimeout) {
      clearTimeout(scanTimeout);
    }
  };

  try {
    subscription = manager.startDeviceScan(
      null, // Scan all services for better device detection
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.warn('BLE scan error:', error);
          stopScan();
          return;
        }

        if (!device) return;

        // より包括的なMi Band検出ロジック
        const deviceName = (device.name || '').toLowerCase();
        const serviceUUIDs = device.serviceUUIDs || [];
        const manufacturerData = device.manufacturerData;
        
        // 名前による検出（より包括的）
        const isMiBandByName = deviceName.includes('mi') ||
                              deviceName.includes('band') ||
                              deviceName.includes('xiaomi') ||
                              deviceName.includes('huami') ||
                              deviceName.includes('amazfit') ||
                              deviceName.includes('mili') ||
                              deviceName.includes('redmi') ||
                              deviceName.includes('fitness') ||
                              deviceName.includes('watch');
        
        // サービスUUIDによる検出
        const hasMiBandService = serviceUUIDs.some(uuid => {
          const cleanUuid = uuid.toLowerCase().replace(/-/g, '');
          return cleanUuid === 'fee0' || 
                 cleanUuid === 'fee1' || 
                 cleanUuid === 'fe95' ||
                 cleanUuid === '180d' ||  // Heart Rate
                 cleanUuid === '180f' ||  // Battery
                 cleanUuid === '1800' ||  // Generic Access
                 cleanUuid === '1801';    // Generic Attribute
        });
        
        // 製造者データによる検出
        const isMiBandByManufacturer = manufacturerData && (
          manufacturerData.includes('157') || 
          manufacturerData.includes('27d') ||
          manufacturerData.includes('343') ||
          manufacturerData.includes('637')
        );
        
        // フィットネストラッカーの一般的な特徴
        const hasCommonFitnessServices = serviceUUIDs.some(uuid => {
          const cleanUuid = uuid.toLowerCase().replace(/-/g, '');
          return cleanUuid === '180d' || // Heart Rate
                 cleanUuid === '180f' || // Battery
                 cleanUuid === '181c';   // User Data
        });
        
        const isMiBand = isMiBandByName || 
                        hasMiBandService || 
                        isMiBandByManufacturer ||
                        (hasCommonFitnessServices && (device.rssi || -100) > -80); // RSSI filter for nearby devices

        if (isMiBand) {
          stopScan();
          onFound(device);
        }
      }
    );

    // 30秒でタイムアウト
    scanTimeout = setTimeout(() => {
      console.log('Mi Band scan timeout');
      stopScan();
    }, 30000);

  } catch (err) {
    console.warn('Failed to start Mi Band scan:', err);
    stopScan();
  }
}

// 使用例: Mi Band検出後の接続処理
export async function connectToMiBandExample(): Promise<boolean> {
  try {
    return new Promise((resolve) => {
      scanForMiBandWithCallback(async (device) => {
        try {
          console.log('Connecting to Mi Band...');
          const connectedDevice = await device.connect();
          
          console.log('Discovering services and characteristics...');
          await connectedDevice.discoverAllServicesAndCharacteristics();
          
          console.log('Mi Band connected successfully!');
          
          // デバイスIDを保存
          await AsyncStorage.setItem('mibandDeviceId', device.id);
          
          resolve(true);
        } catch (error) {
          console.error('Failed to connect to Mi Band:', error);
          resolve(false);
        }
      });
      
      // 35秒でタイムアウト（スキャン30秒 + 接続余裕5秒）
      setTimeout(() => {
        console.log('Mi Band connection attempt timeout');
        resolve(false);
      }, 35000);
    });
  } catch (error) {
    console.error('Mi Band connection error:', error);
    return false;
  }
}

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
