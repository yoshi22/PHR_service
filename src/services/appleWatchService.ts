import { Platform } from 'react-native';
import AppleHealthKit, { 
  HealthKitPermissions,
  HealthInputOptions,
  HealthUnit
} from 'react-native-health';
import { BaseService } from './base/BaseService';
import { ServiceResult, HealthMetrics, ConnectionState } from './types';
import { StorageUtils } from './utils/storageUtils';
import { createSuccessResult, createErrorResult } from './utils/serviceUtils';

/**
 * Apple Watch用のHealthKit連携サービス
 */
export interface HealthKitData extends HealthMetrics {
  workouts: WorkoutData[];
}

export interface WorkoutData {
  type: string;
  duration: number;
  calories: number;
  startDate: Date;
  endDate: Date;
}

export interface AppleWatchConnectionState extends ConnectionState {
  permissions: string[];
}

class AppleWatchService extends BaseService {
  private connectionState: AppleWatchConnectionState = {
    isConnected: false,
    isAuthorized: false,
    lastSyncTime: null,
    permissions: [],
  };

  constructor() {
    super('AppleWatchService');
  }

  /**
   * Initialize the service
   */
  protected async onInitialize(): Promise<void> {
    await this.loadConnectionState();
  }

  /**
   * Dispose of service resources
   */
  protected async onDispose(): Promise<void> {
    // Clean up any resources if needed
  }
  
  /**
   * HealthKitがサポートされているかどうかをチェック
   */
  isSupported(): boolean {
    return Platform.OS === 'ios';
  }

  /**
   * HealthKitの使用権限をリクエスト
   */
  async requestPermissions(): Promise<ServiceResult<boolean>> {
    if (!this.isSupported()) {
      return createErrorResult('PLATFORM_NOT_SUPPORTED', 'Apple Watch integration is only available on iOS');
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

      this.log('info', 'Requesting HealthKit permissions...');
      
      const granted = await new Promise<boolean>((resolve, reject) => {
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          if (error) {
            this.log('error', 'HealthKit permissions denied', error);
            reject(new Error(error));
            return;
          }
          
          this.log('info', 'HealthKit permissions granted');
          resolve(true);
        });
      });

      if (granted) {
        this.connectionState.isAuthorized = true;
        this.connectionState.isConnected = true;
        this.connectionState.permissions = Object.values(permissions.permissions.read);
        await this.saveConnectionState();
      }

      return createSuccessResult(granted);
    } catch (error) {
      this.log('error', 'HealthKit permission request failed', error);
      return createErrorResult('PERMISSION_REQUEST_FAILED', 
        error instanceof Error ? error.message : 'Permission request failed'
      );
    }
  }

  /**
   * Apple Watchとの接続状態を確認
   */
  async checkConnection(): Promise<ServiceResult<boolean>> {
    if (!this.isSupported()) {
      return createSuccessResult(false);
    }

    try {
      await this.loadConnectionState();
      return createSuccessResult(this.connectionState.isConnected);
    } catch (error) {
      this.log('error', 'Failed to check Apple Watch connection', error);
      return createErrorResult('CONNECTION_CHECK_FAILED', 
        error instanceof Error ? error.message : 'Connection check failed'
      );
    }
  }

  /**
   * HealthKitからデータを取得
   */
  async syncHealthData(): Promise<ServiceResult<HealthKitData>> {
    if (!this.connectionState.isAuthorized) {
      return createErrorResult('PERMISSION_DENIED', 'HealthKit permissions not granted');
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
        timestamp: new Date(),
        workouts: [],
      };

      // 最後の同期時間を保存
      this.connectionState.lastSyncTime = new Date();
      await this.saveConnectionState();

      this.log('info', 'Health data synced successfully', { healthData });
      return createSuccessResult(healthData);
    } catch (error) {
      this.log('error', 'Failed to sync Apple Watch data', error);
      return createErrorResult('DATA_SYNC_FAILED', 
        error instanceof Error ? error.message : 'Data sync failed'
      );
    }
  }

  /**
   * ワークアウトデータを取得
   */
  async getWorkouts(startDate: Date, endDate: Date): Promise<ServiceResult<WorkoutData[]>> {
    if (!this.connectionState.isAuthorized) {
      return createErrorResult('PERMISSION_DENIED', 'HealthKit permissions not granted');
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

      return createSuccessResult(workouts);
    } catch (error) {
      this.log('error', 'Failed to get workout data', error);
      return createErrorResult('WORKOUT_FETCH_FAILED', 
        error instanceof Error ? error.message : 'Workout fetch failed'
      );
    }
  }

  /**
   * ワークアウトタイプの表示名を取得
   */
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
  
  /**
   * 接続状態を取得
   */
  getConnectionState(): AppleWatchConnectionState {
    return { ...this.connectionState };
  }

  /**
   * 接続状態を保存
   */
  private async saveConnectionState(): Promise<void> {
    try {
      await StorageUtils.setWithExpiry(
        'appleWatchConnectionState',
        this.connectionState,
        86400000 // 24 hours
      );
    } catch (error) {
      this.log('error', 'Failed to save Apple Watch connection state', error);
    }
  }

  /**
   * 接続状態を読み込み
   */
  private async loadConnectionState(): Promise<void> {
    try {
      const saved = await StorageUtils.getWithExpiry<AppleWatchConnectionState>('appleWatchConnectionState');
      if (saved) {
        this.connectionState = { ...this.connectionState, ...saved };
      }
    } catch (error) {
      this.log('error', 'Failed to load Apple Watch connection state', error);
    }
  }

  /**
   * 接続を切断
   */
  async disconnect(): Promise<ServiceResult<void>> {
    try {
      this.connectionState.isConnected = false;
      this.connectionState.isAuthorized = false;
      this.connectionState.lastSyncTime = null;
      this.connectionState.permissions = [];
      
      await StorageUtils.remove('appleWatchConnectionState');
      
      this.log('info', 'Apple Watch disconnected successfully');
      return createSuccessResult(undefined);
    } catch (error) {
      this.log('error', 'Failed to disconnect Apple Watch', error);
      return createErrorResult('DISCONNECT_FAILED', 
        error instanceof Error ? error.message : 'Disconnect failed'
      );
    }
  }
}

export const appleWatchService = new AppleWatchService();
export default appleWatchService;
