import * as Notifications from 'expo-notifications';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { requireAuth } from '../utils/authUtils';

// 通知タイプの定義
export enum ReminderType {
  GOAL_PROGRESS = 'goal_progress',      // 目標進捗（50%未満など）
  STREAK_AT_RISK = 'streak_at_risk',    // ストリークのリスク通知
  INACTIVITY = 'inactivity',            // 非活動（1日以上の運動なし）
  EVENING_NUDGE = 'evening_nudge',      // 夕方のリマインダー
  HEALTH_RISK = 'health_risk',          // 健康リスク警告
  CUSTOM = 'custom'                     // カスタム通知
}

// リマインダー設定
export interface ReminderSettings {
  userId: string;
  goalProgressEnabled: boolean;         // 目標進捗リマインダー
  streakRiskEnabled: boolean;           // ストリークリスクリマインダー 
  inactivityEnabled: boolean;           // 非活動リマインダー
  eveningNudgeEnabled: boolean;         // 夕方のリマインダー
  healthRiskEnabled: boolean;           // 健康リスク警告
  notificationQuietHours: {             // 通知を出さない時間帯
    start: string;                      // '22:00' 形式
    end: string;                        // '08:00' 形式
  };
  updatedAt: any;                       // サーバータイムスタンプ
}

/**
 * ユーザーのリマインダー設定を取得
 */
export async function getReminderSettings(userId: string): Promise<ReminderSettings | null> {
  try {
    // 認証状態を確認
    const user = requireAuth();
    if (user.uid !== userId) {
      throw new Error('Unauthorized access to reminder settings');
    }

    const settingsRef = doc(db, 'reminderSettings', userId);
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      return settingsSnap.data() as ReminderSettings;
    }
    
    // 設定がない場合はデフォルトの設定を作成して返す
    return initializeReminderSettings(userId);
  } catch (error) {
    console.error('Error getting reminder settings:', error);
    return null;
  }
}

/**
 * リマインダー設定を初期化
 */
export async function initializeReminderSettings(userId: string): Promise<ReminderSettings> {
  const defaultSettings: ReminderSettings = {
    userId,
    goalProgressEnabled: true,
    streakRiskEnabled: true,
    inactivityEnabled: true,
    eveningNudgeEnabled: true,
    healthRiskEnabled: true,
    notificationQuietHours: {
      start: '23:00',
      end: '07:00'
    },
    updatedAt: serverTimestamp()
  };
  
  try {
    const settingsRef = doc(db, 'reminderSettings', userId);
    await setDoc(settingsRef, defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error('Error initializing reminder settings:', error);
    throw error;
  }
}

/**
 * リマインダー設定を更新
 */
export async function updateReminderSettings(settings: Partial<ReminderSettings>): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const settingsRef = doc(db, 'reminderSettings', user.uid);
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error updating reminder settings:', error);
    return false;
  }
}

/**
 * 現在の時刻が通知許可時間内かどうかをチェック
 */
export function isWithinQuietHours(settings: ReminderSettings): boolean {
  const { notificationQuietHours } = settings;
  
  // 現在時刻を取得
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // 開始時刻と終了時刻をパース
  const [startHour, startMinute] = notificationQuietHours.start.split(':').map(Number);
  const [endHour, endMinute] = notificationQuietHours.end.split(':').map(Number);
  
  // 現在時刻をminutes形式に変換 (比較を容易にするため)
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  // 開始時刻が終了時刻より大きい場合（23:00-07:00のような夜間帯の場合）
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  } else {
    // 昼間の時間帯の場合（13:00-17:00など）
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
}

/**
 * 目標進捗リマインダー（目標の50%未満の場合に送信）
 */
export async function sendGoalProgressReminder(
  steps: number, 
  goalSteps: number = 7500, 
  customMessage?: string
): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const settings = await getReminderSettings(user.uid);
    if (!settings || !settings.goalProgressEnabled) return null;
    
    // 静かな時間帯なら通知しない
    if (isWithinQuietHours(settings)) return null;
    
    // 目標の50%未満なら通知
    const progressPercent = Math.round((steps / goalSteps) * 100);
    if (progressPercent >= 50) return null;
    
    const progressMessages = [
      '今日の目標達成まであと少し！',
      'もう少し歩いてみませんか？',
      '少し散歩するだけでも健康に良いですよ！',
      '今日も目標に向かって頑張りましょう！',
      '少しの努力が大きな成果につながります！'
    ];
    
    const randomMessage = customMessage || progressMessages[Math.floor(Math.random() * progressMessages.length)];
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚶‍♀️ 目標の${progressPercent}%達成中`,
        body: randomMessage,
        data: { type: ReminderType.GOAL_PROGRESS },
      },
      trigger: null, // 即時送信
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error sending goal progress reminder:', error);
    return null;
  }
}

/**
 * ストリークリスク通知（連続記録が切れそうな場合に通知）
 */
export async function sendStreakRiskReminder(streak: number): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const settings = await getReminderSettings(user.uid);
    if (!settings || !settings.streakRiskEnabled) return null;
    
    // 静かな時間帯なら通知しない
    if (isWithinQuietHours(settings)) return null;
    
    // 現在の時間を取得
    const now = new Date();
    const currentHour = now.getHours();
    
    // 夕方以降（17時以降）かつストリークが2日以上ある場合のみ通知
    if (currentHour < 17 || streak < 2) return null;
    
    const streakMessages = [
      `${streak}日間の連続記録を維持しましょう！`,
      `今日も記録すれば${streak+1}日連続達成です！`,
      `ストリークを維持するチャンスです！`,
      `${streak}日間のストリークを守りましょう。今すぐ記録を。`,
      `継続は力なり！${streak}日の記録を維持しませんか？`
    ];
    
    const randomMessage = streakMessages[Math.floor(Math.random() * streakMessages.length)];
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚠️ ${streak}日間のストリークが危険です！`,
        body: randomMessage,
        data: { type: ReminderType.STREAK_AT_RISK },
      },
      trigger: null, // 即時送信
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error sending streak risk reminder:', error);
    return null;
  }
}

/**
 * 非活動リマインダー（1日以上活動がない場合に通知）
 */
export async function sendInactivityReminder(daysInactive: number): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const settings = await getReminderSettings(user.uid);
    if (!settings || !settings.inactivityEnabled) return null;
    
    // 静かな時間帯なら通知しない
    if (isWithinQuietHours(settings)) return null;
    
    // 2日以上未記録の場合のみ通知（単純な1日未記録はストリークリスクのほうで対応）
    if (daysInactive < 2) return null;
    
    const inactivityMessages = [
      `${daysInactive}日間記録がありません。今日は少し体を動かしてみませんか？`,
      `${daysInactive}日ぶりの記録で新たなスタートを切りましょう！`,
      `少し歩くだけでも気分がリフレッシュします！`,
      `健康維持のために、今日は少し歩いてみませんか？`,
      `また一緒に歩き始めましょう！小さな一歩から。`
    ];
    
    const randomMessage = inactivityMessages[Math.floor(Math.random() * inactivityMessages.length)];
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `😴 ${daysInactive}日間活動がありません`,
        body: randomMessage,
        data: { type: ReminderType.INACTIVITY },
      },
      trigger: null, // 即時送信
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error sending inactivity reminder:', error);
    return null;
  }
}

/**
 * 夕方のやさしいリマインダー（17時～20時に送信）
 */
export async function scheduleEveningReminder(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const settings = await getReminderSettings(user.uid);
    if (!settings || !settings.eveningNudgeEnabled) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // 17時～20時の間のみスケジュール
    if (currentHour < 17 || currentHour > 20) return null;
    
    // 今日の目標を達成していたら送信しない
    // 実際の実装時には、今日の歩数データを取得して判断する必要があります
    
    const eveningMessages = [
      '今日の健康目標、忘れていませんか？',
      'もう少しで今日も終わります。健康記録を付けてみませんか？',
      '散歩に行くのに最適な時間帯です！',
      '今日の歩数はいかがですか？記録を付けて継続しましょう。',
      '夕方の運動は睡眠の質も向上させます！'
    ];
    
    const randomMessage = eveningMessages[Math.floor(Math.random() * eveningMessages.length)];
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '✨ 今日の健康記録',
        body: randomMessage,
        data: { type: ReminderType.EVENING_NUDGE },
      },
      trigger: null, // 即時送信
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling evening reminder:', error);
    return null;
  }
}

/**
 * 健康リスク警告（長期間未活動の場合に送信）
 */
export async function sendHealthRiskWarning(daysInactive: number): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const settings = await getReminderSettings(user.uid);
    if (!settings || !settings.healthRiskEnabled) return null;
    
    // 7日以上未活動の場合のみ送信
    if (daysInactive < 7) return null;
    
    const healthRiskMessages = [
      `${daysInactive}日間の非活動は健康リスクにつながる可能性があります。`,
      '定期的な運動は心血管疾患リスクを30%軽減します。今日からまた始めませんか？',
      '短時間の散歩でも健康にとって大きな違いを生み出します。',
      '運動不足は睡眠障害や気分の落ち込みにつながることがあります。',
      '1日10分の運動から始めてみませんか？小さな一歩が大切です。'
    ];
    
    const randomMessage = healthRiskMessages[Math.floor(Math.random() * healthRiskMessages.length)];
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚠️ 健康リスク警告`,
        body: randomMessage,
        data: { type: ReminderType.HEALTH_RISK },
      },
      trigger: null, // 即時送信
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error sending health risk warning:', error);
    return null;
  }
}

/**
 * カスタムリマインダーを送信
 */
export async function sendCustomReminder(title: string, message: string): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const settings = await getReminderSettings(user.uid);
    if (!settings) return null;
    
    // 静かな時間帯なら通知しない
    if (isWithinQuietHours(settings)) return null;
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: message,
        data: { type: ReminderType.CUSTOM },
      },
      trigger: null, // 即時送信
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error sending custom reminder:', error);
    return null;
  }
}
