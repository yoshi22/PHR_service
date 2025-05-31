/**
 * Firebase Crashlytics設定ファイル
 * エラーログとクラッシュレポート機能を提供
 */
import { FirebaseCrashlytics } from '@react-native-firebase/crashlytics';
import { firebase } from '../firebase';
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// Crashlyticsインスタンス
let crashlytics: FirebaseCrashlytics | null = null;

/**
 * Crashlyticsを初期化
 */
export const initCrashlytics = async () => {
  try {
    if (Platform.OS === 'web') {
      console.log('Web環境ではCrashlyticsは利用できません');
      return;
    }

    const crashlyticsModule = await import('@react-native-firebase/crashlytics');
    crashlytics = crashlyticsModule.default();
    
    console.log('Crashlytics初期化完了');
    
    // アプリが開発モードかどうかを記録
    if (__DEV__) {
      crashlytics.setAttribute('dev_mode', 'true');
    }
    
    // デバイス情報を記録
    const deviceInfo = await getDeviceInfo();
    Object.entries(deviceInfo).forEach(([key, value]) => {
      if (value) {
        crashlytics.setAttribute(key, value.toString());
      }
    });
    
    // 未処理のJSエラーをキャプチャ
    setupErrorHandlers();
    
  } catch (error) {
    console.error('Crashlyticsの初期化に失敗しました:', error);
  }
};

/**
 * ユーザーIDをCrashlyticsに設定
 */
export const setUserIdentifier = (userId: string | null) => {
  if (!crashlytics || !userId) return;
  
  try {
    crashlytics.setUserId(userId);
  } catch (error) {
    console.error('ユーザーID設定エラー:', error);
  }
};

/**
 * エラーをログ記録
 */
export const logError = (error: Error, additionalData?: Record<string, any>) => {
  if (!crashlytics) return;
  
  try {
    // 追加データがあれば属性として記録
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          crashlytics.setAttribute(key, value.toString());
        }
      });
    }
    
    // エラーを記録
    crashlytics.recordError(error);
    
  } catch (logError) {
    console.error('エラーログ記録失敗:', logError);
  }
};

/**
 * カスタムイベントをログ記録
 */
export const logEvent = (name: string, params?: Record<string, any>) => {
  if (!crashlytics) return;
  
  try {
    crashlytics.log(`EVENT: ${name} ${params ? JSON.stringify(params) : ''}`);
  } catch (error) {
    console.error('イベントログ記録失敗:', error);
  }
};

/**
 * アプリの重要アクションを記録
 */
export const logAction = (actionName: string, succeeded: boolean, details?: string) => {
  if (!crashlytics) return;
  
  const status = succeeded ? 'SUCCESS' : 'FAILED';
  try {
    crashlytics.log(`ACTION: ${actionName} - ${status}${details ? ` - ${details}` : ''}`);
  } catch (error) {
    console.error('アクション記録失敗:', error);
  }
};

/**
 * デバイス情報の取得（サードパーティライブラリに依存）
 */
async function getDeviceInfo(): Promise<Record<string, any>> {
  try {
    const deviceInfoModule = await import('react-native-device-info');
    
    return {
      appVersion: await deviceInfoModule.getVersion(),
      buildNumber: await deviceInfoModule.getBuildNumber(),
      deviceModel: await deviceInfoModule.getModel(),
      systemVersion: await deviceInfoModule.getSystemVersion(),
      deviceBrand: await deviceInfoModule.getBrand(),
    };
  } catch (error) {
    console.warn('デバイス情報取得エラー:', error);
    return {};
  }
}

/**
 * グローバルエラーハンドラを設定
 */
function setupErrorHandlers() {
  if (!global.ErrorUtils) return;

  // 元のエラーハンドラを保存
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  
  // カスタムエラーハンドラ
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (crashlytics) {
      crashlytics.setAttribute('isFatal', isFatal ? 'true' : 'false');
      crashlytics.recordError(error);
    }
    
    // 元のハンドラを呼び出し
    originalHandler(error, isFatal);
  });
}

export default {
  initCrashlytics,
  setUserIdentifier,
  logError,
  logEvent,
  logAction
};
