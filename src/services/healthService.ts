// src/services/healthService.ts

// src/services/healthService.ts
import { NativeModules } from 'react-native';
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
// --- バグ回避のパッチ: ネイティブ実装を JS モジュールに紐づける ---
const { AppleHealthKit: RnAppleHealthKit } = NativeModules;
if (RnAppleHealthKit && typeof AppleHealthKit.initHealthKit !== 'function') {
  // 必要なメソッドをすべて注入
  for (const key of Object.keys(RnAppleHealthKit)) {
    // @ts-ignore
    AppleHealthKit[key] = RnAppleHealthKit[key];
  }
}
import GoogleFit, { Scopes, DailyStepCount } from 'react-native-google-fit';


// --- iOS: HealthKit 初期化 & 権限リクエスト ---
export function initHealthKit(): Promise<void> {
  const permissions: HealthKitPermissions = {
    permissions: {
      read: ['StepCount', 'BodyMass'],  // 読み込みたいデータタイプ
      write: [],                        // 書き込み権限が不要なら空配列
    },
  };
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// --- iOS: 当日の歩数取得 ---
export function getTodayStepsIOS(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const options = { startDate: start.toISOString(), endDate: new Date().toISOString() };
  return new Promise((resolve, reject) => {
    AppleHealthKit.getStepCount(options, (err: string, result: HealthValue) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.value || 0);
      }
    });
  });
}

// --- Android: Google Fit 初期化 & 権限リクエスト ---
export async function initGoogleFit(): Promise<void> {
  const options = {
    scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_BODY_READ],
  };
  const authorized = await GoogleFit.authorize(options);
  if (!authorized.success) {
    throw new Error('Google Fit 認証に失敗しました');
  }
}

// --- Android: 当日の歩数取得 ---
export function getTodayStepsAndroid(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  return GoogleFit.getDailyStepCountSamples({ startDate: start.toISOString(), endDate: end.toISOString() })
    .then((res: DailyStepCount[]) => {
      // 配列から「歩数」だけ合算
      const today = res.find(r => r.source === 'com.xxxxx'); // もしくは総計を取りたい場合
      // 簡易的に先頭の value を返す
      return today?.steps?.[0]?.value || 0;
    });
}
