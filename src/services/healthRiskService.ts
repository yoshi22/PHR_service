import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { sendHealthRiskWarning, sendInactivityReminder, sendCustomReminder } from './smartReminderService';
import { requireAuth } from '../utils/authUtils';

// 健康リスクのタイプ
export enum HealthRiskType {
  INACTIVITY = 'inactivity',               // 運動不足
  IRREGULAR_ACTIVITY = 'irregular_activity', // 不規則な活動パターン
  DECLINED_ACTIVITY = 'declined_activity',   // 活動量低下
  STREAK_BROKEN = 'streak_broken',          // 連続記録失敗
}

// 健康リスク情報
export interface HealthRisk {
  userId: string;
  riskType: HealthRiskType;
  severity: number;               // 1-5のスケール（軽度~重度）
  detectedAt: any;                // 検出日時（サーバータイムスタンプ）
  status: 'active' | 'resolved';  // アクティブか解決済みか
  details: {
    inactiveDays?: number;         // 非活動日数
    activityDeclinePercent?: number; // 活動量低下の割合
    streakBroken?: number;         // 失敗した連続記録の日数
    message?: string;             // 詳細メッセージ
  };
}

// 健康リスク設定
export interface HealthRiskSettings {
  userId: string;
  inactivityAlertThreshold: number;    // 何日間の非活動で警告するか (デフォルト: 3)
  activityDeclineThreshold: number;    // 何%の活動量低下で警告するか (デフォルト: 30)
  enabledRiskTypes: HealthRiskType[];  // 有効なリスクタイプ
  updatedAt: any;                      // サーバータイムスタンプ
}

/**
 * 健康リスク設定を取得
 */
export async function getHealthRiskSettings(userId: string): Promise<HealthRiskSettings | null> {
  try {
    // 認証状態を確認
    const user = requireAuth();
    if (user.uid !== userId) {
      throw new Error('Unauthorized access to health risk settings');
    }

    const settingsRef = doc(db, 'healthRiskSettings', userId);
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      return settingsSnap.data() as HealthRiskSettings;
    }
    
    // 初期値を設定
    return initializeHealthRiskSettings(userId);
  } catch (error) {
    console.error('Error getting health risk settings:', error);
    return null;
  }
}

/**
 * 健康リスク設定を初期化
 */
export async function initializeHealthRiskSettings(userId: string): Promise<HealthRiskSettings> {
  const defaultSettings: HealthRiskSettings = {
    userId,
    inactivityAlertThreshold: 3,    // 3日間の非活動で警告
    activityDeclineThreshold: 30,   // 30%の活動量低下で警告
    enabledRiskTypes: [
      HealthRiskType.INACTIVITY,
      HealthRiskType.DECLINED_ACTIVITY,
      HealthRiskType.STREAK_BROKEN
    ],
    updatedAt: serverTimestamp()
  };
  
  try {
    const settingsRef = doc(db, 'healthRiskSettings', userId);
    await setDoc(settingsRef, defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error('Error initializing health risk settings:', error);
    throw error;
  }
}

/**
 * 健康リスク設定を更新
 */
export async function updateHealthRiskSettings(settings: Partial<HealthRiskSettings>): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const settingsRef = doc(db, 'healthRiskSettings', user.uid);
    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating health risk settings:', error);
    return false;
  }
}

/**
 * アクティブな健康リスクを取得
 */
export async function getActiveHealthRisks(userId: string): Promise<HealthRisk[]> {
  try {
    const risksQuery = query(
      collection(db, 'healthRisks'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('detectedAt', 'desc')
    );
    
    const risksSnap = await getDocs(risksQuery);
    return risksSnap.docs.map(doc => doc.data() as HealthRisk);
  } catch (error) {
    console.error('Error getting active health risks:', error);
    return [];
  }
}

/**
 * 健康リスクを記録
 */
export async function recordHealthRisk(risk: Omit<HealthRisk, 'detectedAt'>): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const riskRef = doc(collection(db, 'healthRisks'));
    await setDoc(riskRef, {
      ...risk,
      detectedAt: serverTimestamp()
    });
    
    return riskRef.id;
  } catch (error) {
    console.error('Error recording health risk:', error);
    return null;
  }
}

/**
 * 健康リスクを解決済みにする
 */
export async function resolveHealthRisk(riskId: string): Promise<boolean> {
  try {
    const riskRef = doc(db, 'healthRisks', riskId);
    await updateDoc(riskRef, {
      status: 'resolved',
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error resolving health risk:', error);
    return false;
  }
}

/**
 * 非活動リスクをチェック
 */
export async function checkInactivityRisk(userId: string): Promise<number | null> {
  try {
    // ユーザーの歩数履歴を取得
    const stepsQuery = query(
      collection(db, 'userSteps'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(14)  // 直近14日間のデータを取得
    );
    
    const stepsSnap = await getDocs(stepsQuery);
    const stepsData = stepsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        date: data.date,
        steps: data.steps || 0
      };
    });
    
    if (stepsData.length === 0) return null;
    
    // 最新のデータが今日のものか確認
    const today = new Date().toISOString().split('T')[0];
    const hasToday = stepsData.some(d => d.date === today);
    
    // 非活動の日数をカウント
    let inactiveDays = 0;
    const threshold = 1000; // 1000歩未満は非活動と見なす
    
    for (let i = hasToday ? 1 : 0; i < stepsData.length; i++) {
      if (stepsData[i].steps < threshold) {
        inactiveDays++;
      } else {
        break; // 活動がある日が見つかったら中断
      }
    }
    
    // 設定された閾値をチェック
    const settings = await getHealthRiskSettings(userId);
    if (!settings) return null;
    
    const inactivityThreshold = settings.inactivityAlertThreshold;
    
    // 閾値を超えたら健康リスク記録とアラート
    if (inactiveDays >= inactivityThreshold && 
        settings.enabledRiskTypes.includes(HealthRiskType.INACTIVITY)) {
      
      // 既存のアクティブなリスクをチェック
      const existingRisks = await getActiveHealthRisks(userId);
      const hasInactivityRisk = existingRisks.some(r => r.riskType === HealthRiskType.INACTIVITY);
      
      if (!hasInactivityRisk) {
        // 新しいリスクを記録
        await recordHealthRisk({
          userId,
          riskType: HealthRiskType.INACTIVITY,
          severity: Math.min(Math.floor(inactiveDays / 2), 5), // 日数に応じた重症度
          status: 'active',
          details: {
            inactiveDays,
            message: `${inactiveDays}日間の活動不足が検出されました。適度な運動を心がけましょう。`
          }
        });
        
        // 通知を送信（健康リスク or 非活動リマインダー）
        if (inactiveDays >= 7) {
          await sendHealthRiskWarning(inactiveDays);
        } else {
          await sendInactivityReminder(inactiveDays);
        }
      }
    }
    
    return inactiveDays;
  } catch (error) {
    console.error('Error checking inactivity risk:', error);
    return null;
  }
}

/**
 * 活動量低下リスクをチェック
 */
export async function checkActivityDeclineRisk(userId: string): Promise<number | null> {
  try {
    // ユーザーの歩数履歴を取得
    const stepsQuery = query(
      collection(db, 'userSteps'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(28)  // 直近4週間のデータを取得
    );
    
    const stepsSnap = await getDocs(stepsQuery);
    const stepsData = stepsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        date: data.date,
        steps: data.steps || 0
      };
    });
    
    if (stepsData.length < 14) return null; // データが不足している
    
    // 直近7日間と前7日間の平均歩数を計算
    let recent7DaysSteps = 0;
    let previous7DaysSteps = 0;
    
    for (let i = 0; i < 7; i++) {
      if (stepsData[i]) recent7DaysSteps += stepsData[i].steps;
      if (stepsData[i + 7]) previous7DaysSteps += stepsData[i + 7].steps;
    }
    
    const recent7DaysAvg = recent7DaysSteps / 7;
    const previous7DaysAvg = previous7DaysSteps / 7;
    
    // 活動量低下の割合を計算
    if (previous7DaysAvg === 0) return null;
    
    const declinePercent = Math.round(((previous7DaysAvg - recent7DaysAvg) / previous7DaysAvg) * 100);
    
    // 設定された閾値をチェック
    const settings = await getHealthRiskSettings(userId);
    if (!settings) return null;
    
    const declineThreshold = settings.activityDeclineThreshold;
    
    // 閾値を超えたら健康リスク記録とアラート
    if (declinePercent >= declineThreshold && 
        settings.enabledRiskTypes.includes(HealthRiskType.DECLINED_ACTIVITY)) {
      
      // 既存のアクティブなリスクをチェック
      const existingRisks = await getActiveHealthRisks(userId);
      const hasDeclineRisk = existingRisks.some(r => r.riskType === HealthRiskType.DECLINED_ACTIVITY);
      
      if (!hasDeclineRisk) {
        // 新しいリスクを記録
        await recordHealthRisk({
          userId,
          riskType: HealthRiskType.DECLINED_ACTIVITY,
          severity: Math.min(Math.floor(declinePercent / 10), 5), // 低下率に応じた重症度
          status: 'active',
          details: {
            activityDeclinePercent: declinePercent,
            message: `最近の活動量が前週と比べて${declinePercent}%減少しています。徐々に活動量を増やしましょう。`
          }
        });
        
        // 通知を送信
        const title = '活動量減少のお知らせ';
        const message = `先週と比べて${declinePercent}%活動量が減っています。毎日少しずつ動きましょう！`;
        await sendCustomReminder(title, message);
      }
    }
    
    return declinePercent;
  } catch (error) {
    console.error('Error checking activity decline risk:', error);
    return null;
  }
}

/**
 * ストリーク切れリスクをチェック
 */
export async function checkStreakBrokenRisk(userId: string, previousStreak: number): Promise<boolean> {
  try {
    if (previousStreak < 7) return false; // 7日未満のストリークは対象外
    
    // 設定をチェック
    const settings = await getHealthRiskSettings(userId);
    if (!settings || !settings.enabledRiskTypes.includes(HealthRiskType.STREAK_BROKEN)) {
      return false;
    }
    
    // 既存のアクティブなリスクをチェック
    const existingRisks = await getActiveHealthRisks(userId);
    const hasStreakRisk = existingRisks.some(r => r.riskType === HealthRiskType.STREAK_BROKEN);
    
    if (!hasStreakRisk) {
      // 新しいリスクを記録
      await recordHealthRisk({
        userId,
        riskType: HealthRiskType.STREAK_BROKEN,
        severity: Math.min(Math.floor(previousStreak / 7), 5), // 長さに応じた重症度
        status: 'active',
        details: {
          streakBroken: previousStreak,
          message: `${previousStreak}日間の連続記録が途切れました。新たな記録に挑戦しましょう！`
        }
      });
      
      // 通知を送信
      const title = 'ストリークがリセットされました';
      const message = `${previousStreak}日間の素晴らしい記録でした！また新しいストリークを始めましょう。`;
      await sendCustomReminder(title, message);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking streak broken risk:', error);
    return false;
  }
}

/**
 * すべての健康リスクをチェック
 */
export async function checkAllHealthRisks(): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const inactivityRisk = await checkInactivityRisk(user.uid);
    const activityDeclineRisk = await checkActivityDeclineRisk(user.uid);
    
    // 結果をログ
    console.log('Health risk check results:', {
      inactivityDays: inactivityRisk,
      activityDeclinePercent: activityDeclineRisk
    });
    
    return true;
  } catch (error) {
    console.error('Error checking all health risks:', error);
    return false;
  }
}
