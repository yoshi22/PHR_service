import { Linking } from 'react-native';
import { BaseService } from './base/BaseService';
import { ServiceResult, HealthMetrics, ConnectionState } from './types';
import { StorageUtils } from './utils/storageUtils';
import { createSuccessResult, createErrorResult } from './utils/serviceUtils';

/**
 * Fitbit Web API連携サービス
 */
export interface FitbitData extends HealthMetrics {
  sleepData: SleepData | null;
  activities: ActivityData[];
}

export interface SleepData {
  totalMinutesAsleep: number;
  totalTimeInBed: number;
  efficiency: number;
  startTime: Date;
  endTime: Date;
}

export interface ActivityData {
  activityName: string;
  duration: number;
  calories: number;
  steps: number;
  startTime: Date;
}

export interface FitbitConnectionState extends ConnectionState {
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: Date | null;
}

interface FitbitAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

class FitbitService extends BaseService {
  private connectionState: FitbitConnectionState = {
    isConnected: false,
    isAuthorized: false,
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null,
    lastSyncTime: null,
  };

  constructor() {
    super('FitbitService');
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

  private authConfig: FitbitAuthConfig = {
    clientId: process.env.EXPO_PUBLIC_FITBIT_CLIENT_ID || '', // .envファイルから取得
    clientSecret: process.env.EXPO_PUBLIC_FITBIT_CLIENT_SECRET || '',
    redirectUri: 'phrapp://fitbit/callback',
    scope: 'activity heartrate nutrition profile settings sleep social weight',
  };

  /**
   * Fitbit OAuth認証を開始
   */
  async startAuthentication(): Promise<ServiceResult<void>> {
    try {
      const authUrl = this.buildAuthUrl();
      
      // OAuth認証画面を開く
      const supported = await Linking.canOpenURL(authUrl);
      if (supported) {
        await Linking.openURL(authUrl);
        this.log('info', 'Fitbit authentication started');
        return createSuccessResult(undefined);
      } else {
        return createErrorResult('URL_NOT_SUPPORTED', 'Cannot open Fitbit authentication URL');
      }
    } catch (error) {
      this.log('error', 'Failed to start Fitbit authentication', error);
      return createErrorResult('AUTH_START_FAILED', 
        error instanceof Error ? error.message : 'Authentication start failed'
      );
    }
  }

  // OAuth認証URLを構築
  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      scope: this.authConfig.scope,
      expires_in: '604800', // 1週間
    });

    return `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;
  }

  /**
   * 認証コードからアクセストークンを取得
   */
  async handleAuthCallback(authCode: string): Promise<ServiceResult<boolean>> {
    try {
      const tokenData = await this.exchangeCodeForToken(authCode);
      
      if (tokenData.access_token) {
        this.connectionState.accessToken = tokenData.access_token;
        this.connectionState.refreshToken = tokenData.refresh_token;
        this.connectionState.isAuthorized = true;
        this.connectionState.isConnected = true;
        this.connectionState.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000));

        await this.saveConnectionState();
        
        this.log('info', 'Fitbit authentication completed successfully');
        return createSuccessResult(true);
      }
      
      return createSuccessResult(false);
    } catch (error) {
      this.log('error', 'Failed to handle Fitbit auth callback', error);
      return createErrorResult('AUTH_CALLBACK_FAILED', 
        error instanceof Error ? error.message : 'Auth callback failed'
      );
    }
  }

  // 認証コードをアクセストークンに交換
  private async exchangeCodeForToken(authCode: string): Promise<any> {
    const tokenUrl = 'https://api.fitbit.com/oauth2/token';
    
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      grant_type: 'authorization_code',
      redirect_uri: this.authConfig.redirectUri,
      code: authCode,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.authConfig.clientId}:${this.authConfig.clientSecret}`)}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 保存されたトークンを読み込んで接続状態を復元
   */
  async restoreConnection(): Promise<ServiceResult<boolean>> {
    try {
      await this.loadConnectionState();

      if (this.connectionState.accessToken && this.connectionState.refreshToken && this.connectionState.isAuthorized) {
        // トークンの有効性を確認
        const isValid = await this.validateToken();
        if (!isValid) {
          const refreshResult = await this.refreshAccessToken();
          if (!refreshResult.success) {
            return refreshResult;
          }
        }

        this.log('info', 'Fitbit connection restored successfully');
        return createSuccessResult(true);
      }

      return createSuccessResult(false);
    } catch (error) {
      this.log('error', 'Failed to restore Fitbit connection', error);
      return createErrorResult('CONNECTION_RESTORE_FAILED', 
        error instanceof Error ? error.message : 'Connection restore failed'
      );
    }
  }

  // アクセストークンの有効性を確認
  private async validateToken(): Promise<boolean> {
    if (!this.connectionState.accessToken) {
      return false;
    }

    try {
      const response = await fetch('https://api.fitbit.com/1/user/-/profile.json', {
        headers: {
          'Authorization': `Bearer ${this.connectionState.accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * アクセストークンを更新
   */
  private async refreshAccessToken(): Promise<ServiceResult<boolean>> {
    if (!this.connectionState.refreshToken) {
      return createErrorResult('NO_REFRESH_TOKEN', 'No refresh token available');
    }

    try {
      const tokenUrl = 'https://api.fitbit.com/oauth2/token';
      
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.connectionState.refreshToken,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.authConfig.clientId}:${this.authConfig.clientSecret}`)}`,
        },
        body: params.toString(),
      });

      if (response.ok) {
        const tokenData = await response.json();
        this.connectionState.accessToken = tokenData.access_token;
        this.connectionState.refreshToken = tokenData.refresh_token;
        this.connectionState.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000));

        await this.saveConnectionState();
        
        this.log('info', 'Fitbit token refreshed successfully');
        return createSuccessResult(true);
      }

      return createErrorResult('TOKEN_REFRESH_FAILED', `Token refresh failed: ${response.statusText}`);
    } catch (error) {
      this.log('error', 'Failed to refresh Fitbit token', error);
      return createErrorResult('TOKEN_REFRESH_ERROR', 
        error instanceof Error ? error.message : 'Token refresh error'
      );
    }
  }

  /**
   * Fitbitからデータを同期
   */
  async syncFitbitData(): Promise<ServiceResult<FitbitData>> {
    if (!this.connectionState.isConnected || !this.connectionState.accessToken) {
      return createErrorResult('NOT_CONNECTED', 'Fitbit is not connected');
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 各種データを並行して取得
      const [stepsData, heartRateData, caloriesData, sleepData, activitiesData] = await Promise.all([
        this.fetchStepsData(today),
        this.fetchHeartRateData(today),
        this.fetchCaloriesData(today),
        this.fetchSleepData(today),
        this.fetchActivitiesData(today),
      ]);

      const fitbitData: FitbitData = {
        steps: stepsData?.value || 0,
        heartRate: heartRateData?.restingHeartRate || 0,
        calories: caloriesData?.value || 0,
        distance: 0, // 歩数から概算で計算可能
        timestamp: new Date(),
        sleepData: sleepData,
        activities: activitiesData,
      };

      // 最後の同期時間を保存
      this.connectionState.lastSyncTime = new Date();
      await this.saveConnectionState();

      this.log('info', 'Fitbit data synced successfully', { fitbitData });
      return createSuccessResult(fitbitData);
    } catch (error) {
      this.log('error', 'Failed to sync Fitbit data', error);
      return createErrorResult('DATA_SYNC_FAILED', 
        error instanceof Error ? error.message : 'Data sync failed'
      );
    }
  }

  // 歩数データを取得
  private async fetchStepsData(date: string): Promise<any> {
    const response = await fetch(`https://api.fitbit.com/1/user/-/activities/steps/date/${date}/1d.json`, {
      headers: {
        'Authorization': `Bearer ${this.connectionState.accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data['activities-steps'][0];
    }
    
    return null;
  }

  // 心拍数データを取得
  private async fetchHeartRateData(date: string): Promise<any> {
    const response = await fetch(`https://api.fitbit.com/1/user/-/activities/heart/date/${date}/1d.json`, {
      headers: {
        'Authorization': `Bearer ${this.connectionState.accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data['activities-heart'][0]?.value;
    }
    
    return null;
  }

  // カロリーデータを取得
  private async fetchCaloriesData(date: string): Promise<any> {
    const response = await fetch(`https://api.fitbit.com/1/user/-/activities/calories/date/${date}/1d.json`, {
      headers: {
        'Authorization': `Bearer ${this.connectionState.accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data['activities-calories'][0];
    }
    
    return null;
  }

  // 睡眠データを取得
  private async fetchSleepData(date: string): Promise<SleepData | null> {
    const response = await fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${date}.json`, {
      headers: {
        'Authorization': `Bearer ${this.connectionState.accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const sleep = data.sleep[0];
      
      if (sleep) {
        return {
          totalMinutesAsleep: sleep.minutesAsleep,
          totalTimeInBed: sleep.timeInBed,
          efficiency: sleep.efficiency,
          startTime: new Date(sleep.startTime),
          endTime: new Date(sleep.endTime),
        };
      }
    }
    
    return null;
  }

  // アクティビティデータを取得
  private async fetchActivitiesData(date: string): Promise<ActivityData[]> {
    const response = await fetch(`https://api.fitbit.com/1/user/-/activities/date/${date}.json`, {
      headers: {
        'Authorization': `Bearer ${this.connectionState.accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.activities.map((activity: any) => ({
        activityName: activity.name,
        duration: activity.duration,
        calories: activity.calories,
        steps: activity.steps || 0,
        startTime: new Date(activity.startTime),
      }));
    }
    
    return [];
  }

  /**
   * 接続状態を取得
   */
  getConnectionState(): FitbitConnectionState {
    return { ...this.connectionState };
  }

  /**
   * 接続を切断
   */
  async disconnect(): Promise<ServiceResult<void>> {
    try {
      this.connectionState.isConnected = false;
      this.connectionState.isAuthorized = false;
      this.connectionState.accessToken = null;
      this.connectionState.refreshToken = null;
      this.connectionState.tokenExpiry = null;
      this.connectionState.lastSyncTime = null;
      
      await StorageUtils.remove('fitbitConnectionState');
      
      this.log('info', 'Fitbit disconnected successfully');
      return createSuccessResult(undefined);
    } catch (error) {
      this.log('error', 'Failed to disconnect Fitbit', error);
      return createErrorResult('DISCONNECT_FAILED', 
        error instanceof Error ? error.message : 'Disconnect failed'
      );
    }
  }

  /**
   * 接続状態を保存
   */
  private async saveConnectionState(): Promise<void> {
    try {
      await StorageUtils.setWithExpiry(
        'fitbitConnectionState',
        this.connectionState,
        86400000 // 24 hours
      );
    } catch (error) {
      this.log('error', 'Failed to save Fitbit connection state', error);
    }
  }

  /**
   * 接続状態を読み込み
   */
  private async loadConnectionState(): Promise<void> {
    try {
      const saved = await StorageUtils.getWithExpiry<FitbitConnectionState>('fitbitConnectionState');
      if (saved) {
        this.connectionState = { ...this.connectionState, ...saved };
      }
    } catch (error) {
      this.log('error', 'Failed to load Fitbit connection state', error);
    }
  }
}

export const fitbitService = new FitbitService();
export default fitbitService;
