import { Platform } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

let bleManager: BleManager | null = null;

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
    console.log('Bluetooth state:', state);
    return state;
  } catch (error) {
    console.error('Failed to check Bluetooth state:', error);
    return 'Unknown';
  }
};

// 全てのBLEデバイスをスキャンする（デバッグ用）
export const scanAllDevices = async (): Promise<Device[]> => {
  const manager = initializeBLE();
  const devices: Device[] = [];
  
  // Bluetooth状態を確認
  const state = await checkBluetoothState();
  if (state !== 'PoweredOn') {
    throw new Error(`Bluetooth is not ready. Current state: ${state}`);
  }
  
  return new Promise((resolve, reject) => {
    let subscription: any = null;
    
    console.log('Starting comprehensive BLE device scan...');
    
    subscription = manager.startDeviceScan(
      null, // すべてのサービス
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          if (subscription && typeof subscription.remove === 'function') {
            subscription.remove();
          }
          reject(error);
          return;
        }
        
        if (device) {
          console.log(`Found device: ${device.name || 'Unnamed'} (${device.id})`);
          if (device.name) {
            console.log(`  - Name: ${device.name}`);
          }
          if (device.serviceUUIDs && device.serviceUUIDs.length > 0) {
            console.log(`  - Services: ${device.serviceUUIDs.join(', ')}`);
          }
          console.log(`  - RSSI: ${device.rssi}`);
          
          devices.push(device);
        }
      }
    );
    
    // 20秒でスキャン終了
    setTimeout(() => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
      manager.stopDeviceScan();
      console.log(`=== Scan Complete ===`);
      console.log(`Total devices found: ${devices.length}`);
      
      // Mi Band候補をフィルタリング（より包括的）
      const candidates = devices.filter(device => {
        const name = device.name?.toLowerCase() || '';
        const serviceUUIDs = device.serviceUUIDs || [];
        const manufacturerData = device.manufacturerData;
        
        // 名前による検出
        const isMiBandByName = name.includes('mi') ||
                              name.includes('band') ||
                              name.includes('xiaomi') ||
                              name.includes('huami') ||
                              name.includes('amazfit') ||
                              name.includes('mili') ||
                              name.includes('redmi') ||
                              name.includes('fitness') ||
                              name.includes('watch') ||
                              name.includes('smart') ||
                              name.includes('tracker');
        
        // サービスUUIDによる検出
        const hasFitnessServices = serviceUUIDs.some(uuid => {
          const cleanUuid = uuid.toLowerCase().replace(/-/g, '');
          return cleanUuid === 'fee0' || 
                 cleanUuid === 'fee1' || 
                 cleanUuid === 'fe95' ||
                 cleanUuid === '180d' ||  // Heart Rate
                 cleanUuid === '180f' ||  // Battery
                 cleanUuid === '1800' ||  // Generic Access
                 cleanUuid === '1801' ||  // Generic Attribute
                 cleanUuid === '181c';    // User Data
        });
        
        // 製造者データによる検出
        const isMiBandByManufacturer = manufacturerData && (
          manufacturerData.includes('157') || 
          manufacturerData.includes('27d') ||
          manufacturerData.includes('343') ||
          manufacturerData.includes('637')
        );
        
        return isMiBandByName || hasFitnessServices || isMiBandByManufacturer;
      });
      
      console.log(`Mi Band candidates: ${candidates.length}`);
      candidates.forEach(device => {
        console.log(`  - Candidate: ${device.name || 'Unnamed'} (${device.id})`);
      });
      
      resolve(devices);
    }, 20000);
  });
};

// 改良されたMi Band検索
export const scanForMiBandImproved = async (): Promise<Device | null> => {
  const allDevices = await scanAllDevices();
  
  // より緩い条件でMi Band候補を検索
  const candidates = allDevices.filter(device => {
    const name = device.name?.toLowerCase() || '';
    const id = device.id?.toLowerCase() || '';
    
    return (
      // 名前による検出
      name.includes('mi band') ||
      name.includes('miband') ||
      name.includes('mi-band') ||
      name.includes('huami') ||
      name.includes('xiaomi') ||
      name.includes('amazfit') ||
      name.includes('mili') ||
      name.includes('redmi') ||
      // 部分一致
      name.includes('mi ') ||
      name.includes(' band') ||
      // IDによる検出（一部のデバイスは名前が空の場合がある）
      id.includes('huami') ||
      id.includes('xiaomi')
    );
  });
  
  if (candidates.length > 0) {
    console.log(`Found ${candidates.length} Mi Band candidates:`);
    candidates.forEach((device, index) => {
      console.log(`  ${index + 1}. ${device.name || 'Unnamed'} (${device.id})`);
    });
    
    // 最初の候補を返す
    return candidates[0];
  }
  
  console.log('No Mi Band candidates found in scan results');
  return null;
};
