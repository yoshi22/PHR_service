import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppleHealthKit, { 
  HealthKitPermissions,
  HealthInputOptions,
  HealthUnit
} from 'react-native-health';

// Apple Watch用のHealthKit連携サービス
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

interface AppleWatchConnectionState {
  isConnected: boolean;
  isAuthorized: boolean;
  lastSyncTime: Date | null;
}

class AppleWatchService {
  private connectionState: AppleWatchConnectionState = {
    isConnected: false,
    isAuthorized: false,
    lastSyncTime: null,
  };
  
  // HealthKitがサポートされているかどうかをチェック
  isSupported(): boolean {
    return Platform.OS === 'ios';
  }

  // HealthKitの使用権限をリクエスト
  async requestHealthKitPermissions(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Watch integration is only available on iOS');
    }

    try {
      // 権限設定
      const permissions: HealthKitPermissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.Workout,
          ],
          write: [],
        },
      };

      console.log('Requesting HealthKit permissions...');
      
      return new Promise((resolve, reject) => {
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          if (error) {
            console.log('[AppleHealthKit] Error getting permissions');
            reject(new Error(error));
            return;
          }
          
          console.log('[AppleHealthKit] Permissions granted');
          this.connectionState.isAuthorized = true;
          this.saveConnectionState();
          resolve(true);
        });
      });
    } catch (error) {
      console.error('HealthKit permission request failed:', error);
      return false;
    }
  }

  // Apple Watchとの接続状態を確認
  async checkConnection(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      const authorized = await AsyncStorage.getItem('appleWatchAuthorized');
      this.connectionState.isAuthorized = authorized === 'true';
      this.connectionState.isConnected = authorized === 'true';
      
      return this.connectionState.isConnected;
    } catch (error) {
      console.error('Failed to check Apple Watch connection:', error);
      return false;
    }
  }

  // HealthKitからデータを取得
  async syncHealthData(): Promise<HealthKitData | null> {
    if (!this.connectionState.isAuthorized) {
      throw new Error('HealthKit permissions not granted');
    }

    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // 歩数の取得
      const getSteps = (): Promise<number> => {
        return new Promise((resolve, reject) => {
          const options = {
            startDate: startOfDay.toISOString(),
            endDate: today.toISOString(),
          };
          
          AppleHealthKit.getStepCount(options, (error: string, results: any) => {
            if (error) {
              reject(new Error(error));
              return;
            }
            resolve(results.value || 0);
          });
        });
      };
      
      // 心拍数の取得
      const getHeartRate = (): Promise<number> => {
        return new Promise((resolve, reject) => {
          const options = {
            startDate: startOfDay.toISOString(),
            endDate: today.toISOString(),
            limit: 1,
            ascending: false,
          };
          
          AppleHealthKit.getHeartRateSamples(options, (error: string, results: any) => {
            if (error) {
              reject(new Error(error));
              return;
            }
            
            const latestSample = results && results.length > 0 ? results[0] : null;
            resolve(latestSample ? latestSample.value : 0);
          });
        });
      };
      
      // カロリーの取得
      const getCalories = (): Promise<number> => {
        return new Promise((resolve, reject) => {
          const options = {
            startDate: startOfDay.toISOString(),
            endDate: today.toISOString(),
          };
          
          AppleHealthKit.getActiveEnergyBurned(options, (error: string, results: any) => {
            if (error) {
              reject(new Error(error));
              return;
            }
            
            let totalCalories = 0;
            if (results && results.length > 0) {
              results.forEach((sample: any) => {
                totalCalories += sample.value;
              });
            }
            
            resolve(Math.round(totalCalories));
          });
        });
      };
      
      // 距離の取得
      const getDistance = (): Promise<number> => {
        return new Promise((resolve, reject) => {
          const options = {
            startDate: startOfDay.toISOString(),
            endDate: today.toISOString(),
          };
          
          AppleHealthKit.getDistanceWalkingRunning(options, (error: string, results: any) => {
            if (error) {
              reject(new Error(error));
              return;
            }
            
            let totalDistance = 0;
            if (results && results.length > 0) {
              results.forEach((sample: any) => {
                totalDistance += sample.value;
              });
            }
            
            resolve(Math.round(totalDistance));
          });
        });
      };
      
      //並行して複数のデータを取得
      const [steps, heartRate, calories, distance] = await Promise.all([
        getSteps(),
        getHeartRate(),
        getCalories(),
        getDistance(),
      ]);
      
      const healthData: HealthKitData = {
        steps,
        heartRate,
        calories,
        distance,
        workouts: [],
      };

      // 最後の同期時間を保存
      this.connectionState.lastSyncTime = new Date();
      await AsyncStorage.setItem('appleWatchLastSync', this.connectionState.lastSyncTime.toISOString());

      return healthData;
    } catch (error) {
      console.error('Failed to sync Apple Watch data:', error);
      return null;
    }
  }

  // ワークアウトデータを取得
  async getWorkouts(startDate: Date, endDate: Date): Promise<WorkoutData[]> {
    if (!this.connectionState.isAuthorized) {
      throw new Error('HealthKit permissions not granted');
    }

    try {
      return new Promise((resolve, reject) => {
        const options = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };
        
        AppleHealthKit.getAnchoredWorkouts(options, (err: any, results: any) => {
          if (err) {
            reject(new Error(err.message || 'Failed to get workouts'));
            return;
          }
          
          const workouts: WorkoutData[] = [];
          
          if (results && results.data && results.data.length > 0) {
            results.data.forEach((workout: any) => {
              workouts.push({
                type: this.getWorkoutTypeDisplay(workout.activityType || workout.activityName),
                duration: workout.duration / 60, // 分単位に変換
                calories: workout.calories || 0,
                startDate: new Date(workout.start),
                endDate: new Date(workout.end),
              });
            });
          }
          
          resolve(workouts);
        });
      });
    } catch (error) {
      console.error('Failed to get workout data:', error);
      return [];
    }
  }

  // ワークアウトタイプの表示名を取得
  private getWorkoutTypeDisplay(activityType: string): string {
    const workoutTypes: Record<string, string> = {
      'HKWorkoutActivityTypeRunning': '走る',
      'HKWorkoutActivityTypeWalking': 'ウォーキング',
      'HKWorkoutActivityTypeSwimming': '水泳',
      'HKWorkoutActivityTypeCycling': 'サイクリング',
      'HKWorkoutActivityTypeYoga': 'ヨガ',
      'HKWorkoutActivityTypeFunctionalStrengthTraining': '筋トレ',
      'HKWorkoutActivityTypeHiking': 'ハイキング',
      'HKWorkoutActivityTypeDance': 'ダンス',
    };
    
    return workoutTypes[activityType] || activityType || 'その他';
  }
  
  // 接続状態を取得
  getConnectionState(): AppleWatchConnectionState {
    return { ...this.connectionState };
  }

  // 接続状態を保存
  private async saveConnectionState(): Promise<void> {
    try {
      await AsyncStorage.setItem('appleWatchAuthorized', this.connectionState.isAuthorized ? 'true' : 'false');
      if (this.connectionState.lastSyncTime) {
        await AsyncStorage.setItem('appleWatchLastSync', this.connectionState.lastSyncTime.toISOString());
      }
      
      // 接続状態と認証状態を同期
      this.connectionState.isConnected = this.connectionState.isAuthorized;
    } catch (error) {
      console.error('Failed to save Apple Watch connection state:', error);
    }
  }

  // 接続を切断
  async disconnect(): Promise<void> {
    this.connectionState.isConnected = false;
    this.connectionState.isAuthorized = false;
    this.connectionState.lastSyncTime = null;
    
    await AsyncStorage.removeItem('appleWatchAuthorized');
    await AsyncStorage.removeItem('appleWatchLastSync');
  }
}

export const appleWatchService = new AppleWatchService();
export default appleWatchService;
