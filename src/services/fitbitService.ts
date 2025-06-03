import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

// Fitbit Web API連携サービス
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

interface FitbitConnectionState {
  isConnected: boolean;
  isAuthorized: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  lastSyncTime: Date | null;
}

interface FitbitAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

class FitbitService {
  private connectionState: FitbitConnectionState = {
    isConnected: false,
    isAuthorized: false,
    accessToken: null,
    refreshToken: null,
    lastSyncTime: null,
  };

  private authConfig: FitbitAuthConfig = {
    clientId: process.env.EXPO_PUBLIC_FITBIT_CLIENT_ID || '', // .envファイルから取得
    clientSecret: process.env.EXPO_PUBLIC_FITBIT_CLIENT_SECRET || '',
    redirectUri: 'phrapp://fitbit/callback',
    scope: 'activity heartrate nutrition profile settings sleep social weight',
  };

  // Fitbit OAuth認証を開始
  async startAuthentication(): Promise<void> {
    try {
      const authUrl = this.buildAuthUrl();
      
      // OAuth認証画面を開く
      const supported = await Linking.canOpenURL(authUrl);
      if (supported) {
        await Linking.openURL(authUrl);
      } else {
        throw new Error('Cannot open Fitbit authentication URL');
      }
    } catch (error) {
      console.error('Failed to start Fitbit authentication:', error);
      throw error;
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

  // 認証コードからアクセストークンを取得
  async handleAuthCallback(authCode: string): Promise<boolean> {
    try {
      const tokenData = await this.exchangeCodeForToken(authCode);
      
      if (tokenData.access_token) {
        this.connectionState.accessToken = tokenData.access_token;
        this.connectionState.refreshToken = tokenData.refresh_token;
        this.connectionState.isAuthorized = true;
        this.connectionState.isConnected = true;

        // トークンを保存
        await AsyncStorage.setItem('fitbitAccessToken', tokenData.access_token);
        await AsyncStorage.setItem('fitbitRefreshToken', tokenData.refresh_token);
        await AsyncStorage.setItem('fitbitAuthorized', 'true');

        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to handle Fitbit auth callback:', error);
      return false;
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

  // 保存されたトークンを読み込んで接続状態を復元
  async restoreConnection(): Promise<boolean> {
    try {
      const accessToken = await AsyncStorage.getItem('fitbitAccessToken');
      const refreshToken = await AsyncStorage.getItem('fitbitRefreshToken');
      const authorized = await AsyncStorage.getItem('fitbitAuthorized');

      if (accessToken && refreshToken && authorized === 'true') {
        this.connectionState.accessToken = accessToken;
        this.connectionState.refreshToken = refreshToken;
        this.connectionState.isAuthorized = true;
        this.connectionState.isConnected = true;

        // トークンの有効性を確認
        const isValid = await this.validateToken();
        if (!isValid) {
          await this.refreshAccessToken();
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to restore Fitbit connection:', error);
      return false;
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

  // アクセストークンを更新
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.connectionState.refreshToken) {
      return false;
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

        await AsyncStorage.setItem('fitbitAccessToken', tokenData.access_token);
        await AsyncStorage.setItem('fitbitRefreshToken', tokenData.refresh_token);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to refresh Fitbit token:', error);
      return false;
    }
  }

  // Fitbitからデータを同期
  async syncFitbitData(): Promise<FitbitData | null> {
    if (!this.connectionState.isConnected || !this.connectionState.accessToken) {
      throw new Error('Fitbit is not connected');
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
        sleepData: sleepData,
        activities: activitiesData,
      };

      // 最後の同期時間を保存
      this.connectionState.lastSyncTime = new Date();
      await AsyncStorage.setItem('fitbitLastSync', this.connectionState.lastSyncTime.toISOString());

      return fitbitData;
    } catch (error) {
      console.error('Failed to sync Fitbit data:', error);
      return null;
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

  // 接続状態を取得
  getConnectionState(): FitbitConnectionState {
    return { ...this.connectionState };
  }

  // 接続を切断
  async disconnect(): Promise<void> {
    this.connectionState.isConnected = false;
    this.connectionState.isAuthorized = false;
    this.connectionState.accessToken = null;
    this.connectionState.refreshToken = null;
    this.connectionState.lastSyncTime = null;
    
    await AsyncStorage.removeItem('fitbitAccessToken');
    await AsyncStorage.removeItem('fitbitRefreshToken');
    await AsyncStorage.removeItem('fitbitAuthorized');
    await AsyncStorage.removeItem('fitbitLastSync');
  }
}

export const fitbitService = new FitbitService();
export default fitbitService;
