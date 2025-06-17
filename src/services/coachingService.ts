/**
 * Coaching Service
 * 
 * Manages AI-powered coaching features including goal setting, daily check-ins,
 * weekly reviews, and just-in-time adaptive interventions (JITAI).
 */
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp, setDoc, getDoc, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { BaseService } from './base/BaseService';
import { ServiceResult } from './types';
import { COLLECTIONS } from './constants';
import { 
  safeTimestampToDate,
  validateRequiredFields 
} from './utils/serviceUtils';
import { StorageUtils } from './utils/storageUtils';

/**
 * Coaching notification types
 */
export type CoachNotificationType = 
  | 'morning_plan'
  | 'evening_reflection'
  | 'weekly_review'
  | 'goal_reminder'
  | 'activity_reminder';

/**
 * User goal structure
 */
export interface UserGoal {
  id?: string;
  userId: string;
  type: 'walking' | 'exercise' | 'stretching' | 'nutrition' | 'sleep' | 'custom';
  description: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  createdAt: Date;
  scheduledDays?: number[]; // 0: Sunday, 1: Monday, ..., 6: Saturday
  completedDates?: string[];
  active: boolean;
  startDate?: Date;
  endDate?: Date;
  weeklyTarget?: number;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Weekly review structure
 */
export interface WeeklyReview {
  id?: string;
  userId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  achievements: string[];
  improvements: string[];
  nextWeekGoals: string[];
  reflection: string;
  aiResponse?: string;
  createdAt: Date;
}

/**
 * Daily check-in structure
 */
export interface DailyCheckin {
  id?: string;
  userId: string;
  date: Date;
  morningPlan: {
    goals: string[];
    completed: boolean;
    completedAt?: Date;
  };
  eveningReflection: {
    achievements: string[];
    challenges: string[];
    completed: boolean;
    completedAt?: Date;
  };
  createdAt: Date;
}

/**
 * Coaching settings structure
 */
export interface CoachingSettings {
  userId: string;
  enableMorningPlan: boolean;
  morningPlanTime: { hour: number; minute: number };
  enableEveningReflection: boolean;
  eveningReflectionTime: { hour: number; minute: number };
  enableWeeklyReview: boolean;
  weeklyReviewDay: number; // 0: Sunday, 1: Monday, ..., 6: Saturday
  weeklyReviewTime: { hour: number; minute: number };
  disableNotificationsFrom: { hour: number; minute: number };
  disableNotificationsTo: { hour: number; minute: number };
  remindersFrequency: 'low' | 'medium' | 'high';
  aiCoachingEnabled: boolean;
  personalizedRecommendations: boolean;
}

/**
 * JITAI (Just-In-Time Adaptive Interventions) configuration
 */
export interface JITAIConfig {
  userId: string;
  enabledInterventions: {
    inactivityReminder: boolean;
    stretchReminder: boolean;
    waterReminder: boolean;
    stressRelief: boolean;
    postureCheck: boolean;
  };
  sensitivityThresholds: {
    inactivityMinutes: number;
    stretchInterval: number;
    waterInterval: number;
    stressInterval: number;
    postureInterval: number;
  };
}

/**
 * Goal progress tracking
 */
export interface GoalProgress {
  goalId: string;
  userId: string;
  date: Date;
  value: number;
  completed: boolean;
  notes?: string;
}

/**
 * Coaching analytics data
 */
export interface CoachingAnalytics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  metrics: {
    goalsCompleted: number;
    totalGoals: number;
    streakDays: number;
    checkinsCompleted: number;
    averageCompletionRate: number;
  };
  insights: string[];
}

/**
 * Default coaching settings
 */
export const DEFAULT_COACHING_SETTINGS: CoachingSettings = {
  userId: '',
  enableMorningPlan: true,
  morningPlanTime: { hour: 8, minute: 0 },
  enableEveningReflection: true,
  eveningReflectionTime: { hour: 21, minute: 0 },
  enableWeeklyReview: true,
  weeklyReviewDay: 6, // Saturday
  weeklyReviewTime: { hour: 18, minute: 0 },
  disableNotificationsFrom: { hour: 22, minute: 0 },
  disableNotificationsTo: { hour: 7, minute: 0 },
  remindersFrequency: 'medium',
  aiCoachingEnabled: true,
  personalizedRecommendations: true,
};

/**
 * Default JITAI configuration
 */
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
 * Service for managing AI-powered coaching features
 */
export class CoachingService extends BaseService {
  constructor() {
    super('CoachingService', {
      enableCaching: true,
      enableRetry: true,
      maxRetries: 3,
    });
  }

  /**
   * Creates or updates a user goal
   * 
   * @param userId - User ID
   * @param goalData - Goal data to create/update
   * @returns Promise containing service result with goal
   * 
   * @example
   * ```typescript
   * const result = await coachingService.createGoal('user123', {
   *   type: 'walking',
   *   description: 'Walk 10,000 steps daily',
   *   targetValue: 10000,
   *   unit: 'steps',
   *   scheduledDays: [1, 2, 3, 4, 5] // Monday to Friday
   * });
   * if (result.success) {
   *   console.log('Goal created:', result.data.id);
   * }
   * ```
   */
  async createGoal(userId: string, goalData: Omit<UserGoal, 'id' | 'userId' | 'createdAt'>): Promise<ServiceResult<UserGoal>> {
    return this.executeOperation(
      async () => {
        const validation = validateRequiredFields({ userId, goalData }, ['userId', 'goalData']);
        if (!validation.success) {
          throw new Error(validation.error?.message || 'Invalid parameters');
        }

        if (!goalData.description || goalData.description.trim().length === 0) {
          throw new Error('Goal description is required');
        }

        const firestore = getFirestore();
        const goal: UserGoal = {
          ...goalData,
          userId,
          createdAt: new Date(),
          active: goalData.active !== false, // Default to true
          completedDates: goalData.completedDates || [],
        };

        const docRef = await addDoc(collection(firestore, COLLECTIONS.COACHING_SESSIONS), {
          ...goal,
          createdAt: Timestamp.fromDate(goal.createdAt),
          startDate: goal.startDate ? Timestamp.fromDate(goal.startDate) : null,
          endDate: goal.endDate ? Timestamp.fromDate(goal.endDate) : null,
        });

        const createdGoal: UserGoal = {
          ...goal,
          id: docRef.id,
        };

        // Clear cached goals
        if (this.config.enableCaching) {
          await StorageUtils.removeByType(userId, 'USER_PROFILE');
        }

        this.log('info', 'Goal created successfully', { userId, goalId: docRef.id, type: goal.type });
        return createdGoal;
      },
      'createGoal',
      { requireAuth: true, requiredUserId: userId }
    );
  }

  /**
   * Gets all goals for a user
   * 
   * @param userId - User ID
   * @param activeOnly - Whether to return only active goals
   * @returns Promise containing service result with goals array
   */
  async getUserGoals(userId: string, activeOnly = true): Promise<ServiceResult<UserGoal[]>> {
    return this.executeOperation(
      async () => {
        const validation = validateRequiredFields({ userId }, ['userId']);
        if (!validation.success) {
          throw new Error(validation.error?.message || 'Invalid parameters');
        }

        // Check cache first
        if (this.config.enableCaching) {
          const cached = await StorageUtils.get<UserGoal[]>(userId, 'USER_PROFILE');
          if (cached.success && cached.data) {
            this.log('info', 'Goals loaded from cache', { userId, count: cached.data.length });
            return activeOnly ? cached.data.filter(goal => goal.active) : cached.data;
          }
        }

        const firestore = getFirestore();
        let goalsQuery = query(
          collection(firestore, COLLECTIONS.COACHING_SESSIONS),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );

        if (activeOnly) {
          goalsQuery = query(goalsQuery, where('active', '==', true));
        }

        const querySnapshot = await getDocs(goalsQuery);
        const goals: UserGoal[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            type: data.type,
            description: data.description,
            targetValue: data.targetValue,
            currentValue: data.currentValue,
            unit: data.unit,
            createdAt: safeTimestampToDate(data.createdAt),
            scheduledDays: data.scheduledDays || [],
            completedDates: data.completedDates || [],
            active: data.active !== false,
            startDate: data.startDate ? safeTimestampToDate(data.startDate) : undefined,
            endDate: data.endDate ? safeTimestampToDate(data.endDate) : undefined,
            weeklyTarget: data.weeklyTarget,
            priority: data.priority || 'medium',
          };
        });

        // Cache the result
        if (this.config.enableCaching) {
          await StorageUtils.set(userId, 'USER_PROFILE', goals);
        }

        this.log('info', 'Goals retrieved', { userId, total: goals.length, active: goals.filter(g => g.active).length });
        return activeOnly ? goals.filter(goal => goal.active) : goals;
      },
      'getUserGoals',
      { requireAuth: true, requiredUserId: userId }
    );
  }

  /**
   * Creates a daily check-in record
   * 
   * @param userId - User ID
   * @param checkinData - Check-in data
   * @returns Promise containing service result with check-in record
   */
  async createDailyCheckin(userId: string, checkinData: Omit<DailyCheckin, 'id' | 'userId' | 'createdAt'>): Promise<ServiceResult<DailyCheckin>> {
    return this.executeOperation(
      async () => {
        const validation = validateRequiredFields({ userId, checkinData }, ['userId', 'checkinData']);
        if (!validation.success) {
          throw new Error(validation.error?.message || 'Invalid parameters');
        }

        const firestore = getFirestore();
        const checkin: DailyCheckin = {
          ...checkinData,
          userId,
          createdAt: new Date(),
        };

        const docRef = await addDoc(collection(firestore, 'dailyCheckins'), {
          ...checkin,
          date: Timestamp.fromDate(checkin.date),
          createdAt: Timestamp.fromDate(checkin.createdAt),
          'morningPlan.completedAt': checkin.morningPlan.completedAt ? Timestamp.fromDate(checkin.morningPlan.completedAt) : null,
          'eveningReflection.completedAt': checkin.eveningReflection.completedAt ? Timestamp.fromDate(checkin.eveningReflection.completedAt) : null,
        });

        const createdCheckin: DailyCheckin = {
          ...checkin,
          id: docRef.id,
        };

        this.log('info', 'Daily check-in created', { userId, checkinId: docRef.id, date: checkin.date.toISOString().split('T')[0] });
        return createdCheckin;
      },
      'createDailyCheckin',
      { requireAuth: true, requiredUserId: userId }
    );
  }

  /**
   * Gets coaching settings for a user
   * 
   * @param userId - User ID
   * @returns Promise containing service result with coaching settings
   */
  async getCoachingSettings(userId: string): Promise<ServiceResult<CoachingSettings>> {
    return this.executeOperation(
      async () => {
        const validation = validateRequiredFields({ userId }, ['userId']);
        if (!validation.success) {
          throw new Error(validation.error?.message || 'Invalid parameters');
        }

        // Check cache first
        if (this.config.enableCaching) {
          const cached = await StorageUtils.get<CoachingSettings>(userId, 'USER_SETTINGS');
          if (cached.success && cached.data) {
            this.log('info', 'Coaching settings loaded from cache', { userId });
            return cached.data;
          }
        }

        const firestore = getFirestore();
        const settingsRef = doc(firestore, 'coachSettings', userId);
        const settingsSnap = await getDoc(settingsRef);

        let settings: CoachingSettings;

        if (!settingsSnap.exists()) {
          // Create default settings
          settings = { ...DEFAULT_COACHING_SETTINGS, userId };
          await setDoc(settingsRef, settings);
          this.log('info', 'Created default coaching settings', { userId });
        } else {
          settings = settingsSnap.data() as CoachingSettings;
        }

        // Cache the result
        if (this.config.enableCaching) {
          await StorageUtils.set(userId, 'USER_SETTINGS', settings);
        }

        return settings;
      },
      'getCoachingSettings',
      { requireAuth: true, requiredUserId: userId }
    );
  }

  /**
   * Updates coaching settings for a user
   * 
   * @param userId - User ID
   * @param settings - Updated settings
   * @returns Promise containing service result
   */
  async updateCoachingSettings(userId: string, settings: Partial<CoachingSettings>): Promise<ServiceResult<void>> {
    return this.executeOperation(
      async () => {
        const validation = validateRequiredFields({ userId, settings }, ['userId', 'settings']);
        if (!validation.success) {
          throw new Error(validation.error?.message || 'Invalid parameters');
        }

        const firestore = getFirestore();
        const settingsRef = doc(firestore, 'coachSettings', userId);
        
        await updateDoc(settingsRef, {
          ...settings,
          userId, // Ensure userId is preserved
        });

        // Clear cached settings
        if (this.config.enableCaching) {
          await StorageUtils.removeByType(userId, 'USER_SETTINGS');
        }

        this.log('info', 'Coaching settings updated', { userId, updatedFields: Object.keys(settings) });
      },
      'updateCoachingSettings',
      { requireAuth: true, requiredUserId: userId }
    );
  }

  /**
   * Generates coaching analytics for a user
   * 
   * @param userId - User ID
   * @param period - Analysis period
   * @param startDate - Start date for analysis
   * @param endDate - End date for analysis
   * @returns Promise containing service result with analytics
   */
  async getCoachingAnalytics(
    userId: string, 
    period: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date
  ): Promise<ServiceResult<CoachingAnalytics>> {
    return this.executeOperation(
      async () => {
        const validation = validateRequiredFields({ userId, period, startDate, endDate }, ['userId', 'period', 'startDate', 'endDate']);
        if (!validation.success) {
          throw new Error(validation.error?.message || 'Invalid parameters');
        }

        // Get user goals for the period
        const goalsResult = await this.getUserGoals(userId, false);
        if (!goalsResult.success) {
          throw new Error('Failed to retrieve user goals');
        }

        const goals = goalsResult.data || [];
        const periodGoals = goals.filter(goal => {
          const goalStart = goal.startDate || goal.createdAt;
          return goalStart >= startDate && goalStart <= endDate;
        });

        // Calculate metrics
        const totalGoals = periodGoals.length;
        const completedGoals = periodGoals.filter(goal => {
          // Check if goal was completed during the period
          return goal.completedDates && goal.completedDates.some(date => {
            const completedDate = new Date(date);
            return completedDate >= startDate && completedDate <= endDate;
          });
        }).length;

        // Calculate streak (simplified implementation)
        let streakDays = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          
          const hasActivity = goals?.some(goal => 
            goal.completedDates?.includes(checkDate.toISOString().split('T')[0])
          ) || false;
          
          if (hasActivity) {
            streakDays++;
          } else {
            break;
          }
        }

        const analytics: CoachingAnalytics = {
          userId,
          period,
          startDate,
          endDate,
          metrics: {
            goalsCompleted: completedGoals,
            totalGoals,
            streakDays,
            checkinsCompleted: 0, // Would need to query check-ins
            averageCompletionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
          },
          insights: this.generateInsights(completedGoals, totalGoals, streakDays),
        };

        this.log('info', 'Coaching analytics generated', { 
          userId, 
          period, 
          completionRate: analytics.metrics.averageCompletionRate 
        });

        return analytics;
      },
      'getCoachingAnalytics',
      { requireAuth: true, requiredUserId: userId }
    );
  }

  /**
   * Generates insights based on analytics data
   * 
   * @private
   */
  private generateInsights(completed: number, total: number, streak: number): string[] {
    const insights: string[] = [];
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    if (completionRate >= 80) {
      insights.push('素晴らしい！目標達成率が非常に高いです');
    } else if (completionRate >= 60) {
      insights.push('良いペースで目標を達成しています');
    } else if (completionRate >= 40) {
      insights.push('目標達成にもう少し取り組んでみましょう');
    } else {
      insights.push('目標を少し見直して、達成しやすいものにしてみませんか');
    }

    if (streak >= 7) {
      insights.push('継続力が素晴らしいです！この調子で続けましょう');
    } else if (streak >= 3) {
      insights.push('良い習慣が身についてきています');
    } else {
      insights.push('小さなことから継続していきましょう');
    }

    return insights;
  }

  /**
   * Performs health check for the service
   * 
   * @protected
   */
  protected async performHealthCheck(): Promise<any> {
    try {
      const firestore = getFirestore();
      
      // Test Firestore connectivity
      const testDoc = doc(firestore, COLLECTIONS.COACHING_SESSIONS, 'health-check-test');
      await getDoc(testDoc);
      
      return {
        firestore: 'connected',
        collections: {
          coachingSessions: COLLECTIONS.COACHING_SESSIONS,
          dailyCheckins: 'dailyCheckins',
          coachSettings: 'coachSettings',
        },
        defaultSettings: DEFAULT_COACHING_SETTINGS,
        caching: this.config.enableCaching ? 'enabled' : 'disabled',
      };
    } catch (error) {
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Message generation utilities
 */

/**
 * Generates morning plan message
 */
export const generateMorningPlanMessage = (userName: string, todayDate: Date): string => {
  const today = format(todayDate, 'yyyy年MM月dd日', { locale: ja });
  const dayOfWeek = format(todayDate, 'EEEE', { locale: ja });
  
  return `おはようございます、${userName}さん！\n\n今日は${today}（${dayOfWeek}）です。\n今日のプランを立てましょう。ウォーキング、筋トレ、ストレッチ、食事のポイントからひとつ選んでチャレンジしてみませんか？`;
};

/**
 * Generates evening reflection message
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
 * Generates weekly review message
 */
export const generateWeeklyReviewMessage = (userName: string): string => {
  return `今週もお疲れさまでした、${userName}さん！\n\n1週間の運動・食事・睡眠を振り返ってみましょう。うまくいったこと、もう少し改善できそうだったことを教えてください。`;
};

// Legacy exports for backward compatibility
export type CoachSettings = CoachingSettings;
export const DEFAULT_COACH_SETTINGS = DEFAULT_COACHING_SETTINGS;

// Named export for new architecture
// CoachingService is already exported above