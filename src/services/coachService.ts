import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp, setDoc, getDoc, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import * as aiService from './aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// コーチングの通知タイプ
export type CoachNotificationType = 
  | 'morningPlan'       // 朝の計画
  | 'eveningReflection' // 夕方の振り返り
  | 'weeklyReview'      // 週末の振り返り
  | 'goalReminder'      // 目標リマインダー
  | 'activityReminder'; // 活動リマインダー

// ユーザー目標の型
export type UserGoal = {
  id?: string;
  userId: string;
  type: string; // 'walking', 'exercise', 'stretching', 'nutrition', 'sleep'
  description: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  createdAt: Timestamp;
  scheduledDays?: number[]; // 0: 日曜, 1: 月曜, ..., 6: 土曜
  completedDates?: string[];
  active: boolean;
  startDate?: Timestamp;
  endDate?: Timestamp;
  weeklyTarget?: number;
};

// 週間レビューの型
export type WeeklyReview = {
  id?: string;
  userId: string;
  weekStartDate: Timestamp;
  weekEndDate: Timestamp;
  achievements: string[];
  improvements: string[];
  nextWeekGoals: string[];
  reflection: string;
  createdAt: Timestamp;
};

// 日次チェックインの型
export type DailyCheckin = {
  id?: string;
  userId: string;
  date: Timestamp;
  morningPlan: {
    goals: string[];
    completed: boolean;
  };
  eveningReflection: {
    achievements: string[];
    challenges: string[];
    completed: boolean;
  };
  createdAt: Timestamp;
};

// コーチング設定の型
export type CoachSettings = {
  userId: string;
  enableMorningPlan: boolean;
  morningPlanTime: { hour: number; minute: number };
  enableEveningReflection: boolean;
  eveningReflectionTime: { hour: number; minute: number };
  enableWeeklyReview: boolean;
  weeklyReviewDay: number; // 0: 日曜, 1: 月曜, ..., 6: 土曜
  weeklyReviewTime: { hour: number; minute: number };
  disableNotificationsFrom: { hour: number; minute: number };
  disableNotificationsTo: { hour: number; minute: number };
  remindersFrequency: 'low' | 'medium' | 'high';
};

// デフォルトのコーチング設定
export const DEFAULT_COACH_SETTINGS: CoachSettings = {
  userId: '',
  enableMorningPlan: true,
  morningPlanTime: { hour: 8, minute: 0 },
  enableEveningReflection: true,
  eveningReflectionTime: { hour: 21, minute: 0 },
  enableWeeklyReview: true,
  weeklyReviewDay: 6, // 土曜日
  weeklyReviewTime: { hour: 18, minute: 0 },
  disableNotificationsFrom: { hour: 22, minute: 0 },
  disableNotificationsTo: { hour: 7, minute: 0 },
  remindersFrequency: 'medium',
};

// Just-In-Time Adaptive Interventions (JITAI)の設定型
export type JITAIConfig = {
  userId: string;
  enabledInterventions: {
    inactivityReminder: boolean;
    stretchReminder: boolean;
    waterReminder: boolean;
    stressRelief: boolean;
    postureCheck: boolean;
  };
  sensitivityThresholds: {
    inactivityMinutes: number;  // x分間動いていない場合
    stretchInterval: number;    // x時間ごとにストレッチリマインダー
    waterInterval: number;      // x時間ごとに水分補給リマインダー
    stressInterval: number;     // x時間ごとにストレス軽減リマインダー
    postureInterval: number;    // x時間ごとに姿勢確認リマインダー
  };
};

// デフォルトのJITAI設定
export const DEFAULT_JITAI_CONFIG: JITAIConfig = {
  userId: '',
  enabledInterventions: {
    inactivityReminder: true,
    stretchReminder: true,
    waterReminder: true,
    stressRelief: true,
    postureCheck: true,
  },
  sensitivityThresholds: {
    inactivityMinutes: 60,
    stretchInterval: 2,
    waterInterval: 1.5,
    stressInterval: 3,
    postureInterval: 1,
  }
};

/**
 * 朝の計画メッセージを生成する
 */
export const generateMorningPlanMessage = (userName: string, todayDate: Date): string => {
  const today = format(todayDate, 'yyyy年MM月dd日', { locale: ja });
  const dayOfWeek = format(todayDate, 'EEEE', { locale: ja });
  
  return `おはようございます、${userName}さん！\n\n今日は${today}（${dayOfWeek}）です。\n今日のプランを立てましょう。ウォーキング、筋トレ、ストレッチ、食事のポイントからひとつ選んでチャレンジしてみませんか？`;
};

/**
 * 夕方の振り返りメッセージを生成する
 */
export const generateEveningReflectionMessage = (userName: string, goals: string[]): string => {
  let goalsText = '';
  if (goals && goals.length > 0) {
    goalsText = '今日は以下の目標を設定しました：\n';
    goals.forEach((goal, index) => {
      goalsText += `・${goal}\n`;
    });
    goalsText += '\nこれらの目標はうまくいきましたか？達成できたこと、難しかったことを教えてください。';
  } else {
    goalsText = '今日の活動はいかがでしたか？できたこと、難しかったことを教えてください。';
  }
  
  return `お疲れさまです、${userName}さん！\n\n${goalsText}`;
};

/**
 * 週末の振り返りメッセージを生成する
 */
export const generateWeeklyReviewMessage = (userName: string): string => {
  return `今週もお疲れさまでした、${userName}さん！\n\n1週間の運動・食事・睡眠を振り返ってみましょう。うまくいったこと、もう少し改善できそうだったことを教えてください。`;
};

/**
 * AIチャットへの週間レビューレスポンスを生成するためのシステムプロンプト
 */
export const getWeeklyReviewSystemPrompt = (): string => {
  return `あなたはパーソナルジムコーチとして、ユーザーの1週間の活動を分析し、適切なアドバイスを提供してください。

以下の手順でユーザーの週間振り返りに応答してください：

1. まず、ユーザーの成果を具体的に褒めてください（どんな小さな成果も重要です）
2. 改善点については建設的なアドバイスを提供してください
3. 次週の目標として、以下の中から2-3つを具体的に提案してください：
   - 継続すべき良い習慣
   - 小さな改善点（実現可能なもの）
   - 新しいチャレンジ（ユーザーの現状に合ったもの）
4. 最後に励ましの言葉で締めくくってください

回答は親しみやすく、ポジティブな口調で、300字程度にまとめてください。`;
};

/**
 * AIチャットへの朝の計画レスポンスを生成するためのシステムプロンプト
 */
export const getMorningPlanSystemPrompt = (): string => {
  return `あなたはパーソナルジムコーチとして、ユーザーの朝の計画立案をサポートしてください。

以下の手順でユーザーの朝の計画に応答してください：

1. ユーザーが選んだ活動を肯定的に受け止めてください
2. その活動に対して、具体的で実行可能な目標を1-2つ提案してください
   - 例：「今日のストレッチは寝る前に5分間全身ストレッチと提案します」
3. 必要に応じて補足のアドバイスを簡潔に提供してください
   - 食事に関する簡単なヒント
   - 活動のベストタイミング
   - メリットの説明など
4. 最後にユーザーを励まし、リマインダーの設定を提案してください

回答は親しみやすく、ポジティブな口調で、200字程度にまとめてください。`;
};

/**
 * AIチャットへの夕方の振り返りレスポンスを生成するためのシステムプロンプト
 */
export const getEveningReflectionSystemPrompt = (): string => {
  return `あなたはパーソナルジムコーチとして、ユーザーの1日の振り返りをサポートしてください。

以下の手順でユーザーの夕方の振り返りに応答してください：

1. ユーザーの成果を具体的に褒めてください（どんな小さな成果も重要です）
2. 難しかったことについて共感し、明日に向けての簡単な改善策を1つ提案してください
3. 明日の活動につながるポジティブなアドバイスを提供してください
4. 最後に休息の大切さを伝え、励ましの言葉で締めくくってください

回答は親しみやすく、ポジティブな口調で、200字程度にまとめてください。`;
};

/**
 * 新しい目標を作成する
 */
export const createGoal = async (goal: UserGoal): Promise<string> => {
  try {
    const db = getFirestore();
    const goalsCollection = collection(db, 'userGoals');
    
    const docRef = await addDoc(goalsCollection, {
      ...goal,
      createdAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
};

/**
 * ユーザーの目標を取得する
 */
export const getUserGoals = async (userId: string, active: boolean = true): Promise<UserGoal[]> => {
  try {
    const db = getFirestore();
    const goalsCollection = collection(db, 'userGoals');
    
    // Query only by userId for better compatibility with security rules
    const q = query(
      goalsCollection, 
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filter by active status in memory
    return querySnapshot.docs
      .filter(doc => doc.data().active === active)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserGoal));
  } catch (error) {
    console.error('Error getting user goals:', error);
    throw error;
  }
};

/**
 * 目標の達成状況を更新する
 */
export const updateGoalProgress = async (goalId: string, currentValue: number): Promise<void> => {
  try {
    const db = getFirestore();
    const goalRef = doc(db, 'userGoals', goalId);
    
    await updateDoc(goalRef, {
      currentValue: currentValue
    });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    throw error;
  }
};

/**
 * 新しい週間レビューを作成する
 */
export const createWeeklyReview = async (review: WeeklyReview): Promise<string> => {
  try {
    const db = getFirestore();
    const reviewsCollection = collection(db, 'weeklyReviews');
    
    const docRef = await addDoc(reviewsCollection, {
      ...review,
      createdAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating weekly review:', error);
    throw error;
  }
};

/**
 * 日次チェックインを作成または更新する
 */
export const upsertDailyCheckin = async (checkin: DailyCheckin): Promise<string> => {
  try {
    const db = getFirestore();
    const checkinsCollection = collection(db, 'dailyCheckins');
    
    // 同じ日付のチェックインがあるか確認
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      checkinsCollection,
      where('userId', '==', checkin.userId),
      where('date', '==', Timestamp.fromDate(today))
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // 既存のチェックインを更新
      const existingDoc = querySnapshot.docs[0];
      const existingCheckin = existingDoc.data() as DailyCheckin;
      
      const updatedCheckin = {
        ...existingCheckin,
        ...checkin,
        createdAt: Timestamp.now()
      };
      
      await updateDoc(doc(db, 'dailyCheckins', existingDoc.id), updatedCheckin);
      return existingDoc.id;
    } else {
      // 新しいチェックインを作成
      const docRef = await addDoc(checkinsCollection, {
        ...checkin,
        date: Timestamp.fromDate(today),
        createdAt: Timestamp.now()
      });
      
      return docRef.id;
    }
  } catch (error) {
    console.error('Error upserting daily checkin:', error);
    throw error;
  }
};

/**
 * 今日の日次チェックインを取得する
 */
export const getTodayCheckin = async (userId: string): Promise<DailyCheckin | null> => {
  try {
    const db = getFirestore();
    const checkinsCollection = collection(db, 'dailyCheckins');
    
    // Using a safer approach - get by userId first then filter in memory by date
    // This helps avoid potential issues with date/timestamp formats in Firestore
    const q = query(
      checkinsCollection,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(10) // Get recent checkins
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Get today's date as string (YYYY-MM-DD)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's checkin in the results
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const checkinDate = data.date instanceof Timestamp 
        ? data.date.toDate() 
        : new Date(data.date);
      
      checkinDate.setHours(0, 0, 0, 0);
      
      if (checkinDate.getTime() === today.getTime()) {
        return {
          id: doc.id,
          ...data
        } as DailyCheckin;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting today checkin:', error);
    throw error;
  }
};

/**
 * コーチング設定を保存する
 */
export const saveCoachSettings = async (settings: CoachSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem('coachSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving coach settings:', error);
    throw error;
  }
};

/**
 * コーチング設定を読み込む
 */
export const loadCoachSettings = async (userId: string): Promise<CoachSettings> => {
  try {
    const settingsStr = await AsyncStorage.getItem('coachSettings');
    if (settingsStr) {
      return JSON.parse(settingsStr) as CoachSettings;
    } else {
      // デフォルト設定を返す
      return {
        ...DEFAULT_COACH_SETTINGS,
        userId
      };
    }
  } catch (error) {
    console.error('Error loading coach settings:', error);
    // エラー時もデフォルト設定を返す
    return {
      ...DEFAULT_COACH_SETTINGS,
      userId
    };
  }
};

// ユーザーのJITAI設定を読み込む
export const loadJITAIConfig = async (userId: string): Promise<JITAIConfig> => {
  try {
    // まずLocalStorageから確認
    const localConfig = await AsyncStorage.getItem(`jitai_config_${userId}`);
    
    if (localConfig) {
      return JSON.parse(localConfig);
    }

    // Firestoreから読み込み
    const firestore = getFirestore();
    const docRef = doc(firestore, 'userSettings', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().jitaiConfig) {
      const config = docSnap.data().jitaiConfig;
      // LocalStorageにも保存
      await AsyncStorage.setItem(`jitai_config_${userId}`, JSON.stringify(config));
      return config;
    }
    
    // 設定がなければデフォルトを使用
    const defaultConfig = {
      ...DEFAULT_JITAI_CONFIG,
      userId,
    };
    
    // デフォルト設定を保存
    await updateJITAIConfig(userId, defaultConfig);
    
    return defaultConfig;
  } catch (error) {
    console.error('Failed to load JITAI config:', error);
    return {
      ...DEFAULT_JITAI_CONFIG,
      userId,
    };
  }
};

// JITAIの設定を更新する
export const updateJITAIConfig = async (userId: string, config: JITAIConfig): Promise<void> => {
  try {
    // LocalStorageに保存
    await AsyncStorage.setItem(`jitai_config_${userId}`, JSON.stringify(config));
    
    // Firestoreにも保存
    const firestore = getFirestore();
    const docRef = doc(firestore, 'userSettings', userId);
    await setDoc(docRef, { jitaiConfig: config, updatedAt: Timestamp.now() }, { merge: true });
  } catch (error) {
    console.error('Failed to update JITAI config:', error);
    throw error;
  }
};

/**
 * インタラクティブな介入メッセージを生成する
 */
export const generateJITAIMessage = (
  interventionType: 'inactivity' | 'stretch' | 'water' | 'stress' | 'posture',
  userName: string
): string => {
  const messages = {
    inactivity: [
      `${userName}さん、少し動きましょう。短い散歩はいかがですか？`,
      `長時間座りっぱなしですね。立ち上がって軽く身体を動かしましょう。`,
      `活動的な休憩の時間です！ちょっとストレッチをしませんか？`,
      `１時間動いていません。健康のために立ち上がって動きましょう。`
    ],
    stretch: [
      `${userName}さん、ストレッチの時間です。肩と首の緊張をほぐしましょう。`,
      `デスクワークの合間に軽いストレッチはいかがですか？`,
      `背中と肩のストレッチで、姿勢を改善しましょう。`,
      `手首と指のストレッチをすることで、タイピングによる疲労を軽減できます。`
    ],
    water: [
      `${userName}さん、水分補給の時間です。一杯の水を飲みましょう。`,
      `健康のために水分を摂りましょう。今日は十分な水分を取れていますか？`,
      `水分補給を忘れずに。体調を整えるためには水分が大切です。`,
      `水を一杯飲むと、集中力と気分が改善します！`
    ],
    stress: [
      `${userName}さん、深呼吸をして、少しリラックスする時間を取りましょう。`,
      `ストレスを感じていませんか？30秒間、目を閉じて深呼吸してみましょう。`,
      `短い瞑想は、ストレスを軽減する効果があります。試してみませんか？`,
      `気分転換のために、窓の外を見て、遠くに目を向けるといいですよ。`
    ],
    posture: [
      `${userName}さん、姿勢チェックの時間です。背筋を伸ばして座っていますか？`,
      `姿勢を意識していますか？肩の力を抜いて、背筋を伸ばしましょう。`,
      `猫背になっていませんか？姿勢を正すと、肩こりや腰痛の予防になります。`,
      `正しい姿勢を保つことで、呼吸が深くなり、集中力も高まります。`
    ]
  };

  const randomIndex = Math.floor(Math.random() * messages[interventionType].length);
  return messages[interventionType][randomIndex];
};

/**
 * 活動状態に基づいてJITAIを判断する
 */
export const determineNeededIntervention = async (
  userId: string,
  activityData: any,
  lastInterventions: Record<string, Date>
): Promise<{ type: string; message: string } | null> => {
  try {
    const config = await loadJITAIConfig(userId);
    const userName = await getUserName(userId);
    const now = new Date();
    
    // ユーザー名が取得できない場合は「ユーザー」を使用
    const displayName = userName || 'ユーザー';
    
    // 各介入タイプの判断
    if (
      config.enabledInterventions.inactivityReminder &&
      activityData.minutesSinceLastActivity >= config.sensitivityThresholds.inactivityMinutes &&
      (!lastInterventions.inactivity || 
       (now.getTime() - lastInterventions.inactivity.getTime()) > 3600000) // 最低1時間間隔
    ) {
      return {
        type: 'inactivity',
        message: generateJITAIMessage('inactivity', displayName)
      };
    }
    
    if (
      config.enabledInterventions.stretchReminder &&
      (!lastInterventions.stretch || 
       (now.getTime() - lastInterventions.stretch.getTime()) > config.sensitivityThresholds.stretchInterval * 3600000)
    ) {
      return {
        type: 'stretch',
        message: generateJITAIMessage('stretch', displayName)
      };
    }
    
    if (
      config.enabledInterventions.waterReminder &&
      (!lastInterventions.water || 
       (now.getTime() - lastInterventions.water.getTime()) > config.sensitivityThresholds.waterInterval * 3600000)
    ) {
      return {
        type: 'water',
        message: generateJITAIMessage('water', displayName)
      };
    }
    
    if (
      config.enabledInterventions.stressRelief &&
      (!lastInterventions.stress || 
       (now.getTime() - lastInterventions.stress.getTime()) > config.sensitivityThresholds.stressInterval * 3600000)
    ) {
      return {
        type: 'stress',
        message: generateJITAIMessage('stress', displayName)
      };
    }
    
    if (
      config.enabledInterventions.postureCheck &&
      (!lastInterventions.posture || 
       (now.getTime() - lastInterventions.posture.getTime()) > config.sensitivityThresholds.postureInterval * 3600000)
    ) {
      return {
        type: 'posture',
        message: generateJITAIMessage('posture', displayName)
      };
    }
    
    return null; // 介入の必要なし
  } catch (error) {
    console.error('Error determining intervention:', error);
    return null;
  }
};

/**
 * ユーザーの表示名を取得する
 */
export const getUserName = async (userId: string): Promise<string | null> => {
  try {
    // LocalStorageからチェック
    const cachedName = await AsyncStorage.getItem(`user_name_${userId}`);
    if (cachedName) return cachedName;
    
    // Firestoreから取得
    const firestore = getFirestore();
    const docRef = doc(firestore, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      const name = userData.displayName || userData.name || null;
      
      // キャッシュに保存
      if (name) {
        await AsyncStorage.setItem(`user_name_${userId}`, name);
      }
      
      return name;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get user name:', error);
    return null;
  }
};
