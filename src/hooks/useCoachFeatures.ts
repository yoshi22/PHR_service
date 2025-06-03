import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import * as coachService from '../services/coachService';
import { UserGoal, DailyCheckin, WeeklyReview, CoachSettings, JITAIConfig } from '../services/coachService';
import * as notificationService from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

export function useCoachFeatures() {
  const { user } = useAuth();
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null);
  const [coachSettings, setCoachSettings] = useState<CoachSettings | null>(null);
  const [jitaiConfig, setJitaiConfig] = useState<JITAIConfig | null>(null); 
  const [lastInterventions, setLastInterventions] = useState<Record<string, Date>>({});
  const [isLoading, setIsLoading] = useState(true);

  // コーチ設定のロード
  useEffect(() => {
    const loadSettings = async () => {
      if (user && user.uid) {
        try {
          const settings = await coachService.loadCoachSettings(user.uid);
          setCoachSettings(settings);
          
          // JITAI設定も読み込む
          const jitaiSettings = await coachService.loadJITAIConfig(user.uid);
          setJitaiConfig(jitaiSettings);
          
          // 最後の介入タイムスタンプをロード
          const interventionsStr = await AsyncStorage.getItem(`last_interventions_${user.uid}`);
          if (interventionsStr) {
            const savedInterventions = JSON.parse(interventionsStr);
            // 日付文字列をDate型に変換
            const parsedInterventions: Record<string, Date> = {};
            Object.entries(savedInterventions).forEach(([key, value]) => {
              parsedInterventions[key] = new Date(value as string);
            });
            setLastInterventions(parsedInterventions);
          }
        } catch (error) {
          console.error('Failed to load coach settings:', error);
        }
      }
    };

    loadSettings();
  }, [user]);

  // 目標の読み込み
  const loadUserGoals = useCallback(async () => {
    if (!user || !user.uid) return;

    setIsLoading(true);
    try {
      const goals = await coachService.getUserGoals(user.uid, true);
      setUserGoals(goals);
    } catch (error) {
      console.error('Failed to load user goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 今日のチェックインを取得
  const loadTodayCheckin = useCallback(async () => {
    if (!user || !user.uid) return;

    try {
      const checkin = await coachService.getTodayCheckin(user.uid);
      setTodayCheckin(checkin);
    } catch (error) {
      console.error('Failed to load today checkin:', error);
    }
  }, [user]);

  // 初期ロード
  useEffect(() => {
    if (user && user.uid) {
      loadUserGoals();
      loadTodayCheckin();
    }
  }, [user, loadUserGoals, loadTodayCheckin]);

  // 目標の作成
  const createGoal = useCallback(async (goal: Omit<UserGoal, 'userId' | 'createdAt'>) => {
    if (!user || !user.uid) return null;

    try {
      const newGoal: UserGoal = {
        ...goal,
        userId: user.uid,
        createdAt: new Date() as any,
        active: true,
      };
      
      const goalId = await coachService.createGoal(newGoal);
      
      // 目標リストを更新
      setUserGoals(prevGoals => [
        ...prevGoals,
        { ...newGoal, id: goalId }
      ]);
      
      return goalId;
    } catch (error) {
      console.error('Failed to create goal:', error);
      return null;
    }
  }, [user]);

  // 目標の達成状況を更新
  const updateGoalProgress = useCallback(async (goalId: string, currentValue: number) => {
    try {
      await coachService.updateGoalProgress(goalId, currentValue);
      
      // ローカルのゴールを更新
      setUserGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId ? { ...goal, currentValue } : goal
        )
      );
      
      return true;
    } catch (error) {
      console.error('Failed to update goal progress:', error);
      return false;
    }
  }, []);

  // 日次チェックインの保存/更新
  const saveDailyCheckin = useCallback(async (checkin: Partial<DailyCheckin>) => {
    if (!user || !user.uid) return null;

    try {
      const today = new Date();
      let updatedCheckin: DailyCheckin = {
        userId: user.uid,
        date: today as any,
        morningPlan: {
          goals: [],
          completed: false,
          ...checkin.morningPlan
        },
        eveningReflection: {
          achievements: [],
          challenges: [],
          completed: false,
          ...checkin.eveningReflection
        },
        createdAt: today as any,
        ...checkin,
      };
      
      // チェックインを保存/更新
      const checkinId = await coachService.upsertDailyCheckin(updatedCheckin);
      
      // 状態を更新
      setTodayCheckin(updatedCheckin);
      
      return checkinId;
    } catch (error) {
      console.error('Failed to save daily checkin:', error);
      return null;
    }
  }, [user]);

  // 目標完了の切り替え
  const toggleGoalCompletion = useCallback(async (goalId: string, completed: boolean) => {
    const goal = userGoals.find(g => g.id === goalId);
    if (!goal) return false;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const completedDates = goal.completedDates || [];
      
      let updatedDates: string[];
      if (completed) {
        // 既に含まれていなければ追加
        updatedDates = completedDates.includes(today) 
          ? completedDates 
          : [...completedDates, today];
      } else {
        // 含まれていれば削除
        updatedDates = completedDates.filter(date => date !== today);
      }
      
      // Firestoreで目標を更新
      try {
        // Use the standard imports from the top of the file
        const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
        const db = getFirestore();
        const docRef = doc(db, 'userGoals', goalId);
        await updateDoc(docRef, {
          completedDates: updatedDates
        });
      } catch (error) {
        console.error('Error updating goal completion:', error);
        return false;
      }
      
      // ローカル状態を更新
      setUserGoals(prevGoals => 
        prevGoals.map(g => 
          g.id === goalId ? { ...g, completedDates: updatedDates } : g
        )
      );
      
      return true;
    } catch (error) {
      console.error('Failed to toggle goal completion:', error);
      return false;
    }
  }, [userGoals]);

  // コーチ設定の保存
  const saveSettings = useCallback(async (settings: Partial<CoachSettings>) => {
    if (!user || !user.uid) return false;

    try {
      const updatedSettings: CoachSettings = {
        ...coachService.DEFAULT_COACH_SETTINGS,
        ...coachSettings,
        ...settings,
        userId: user.uid,
      };
      
      await coachService.saveCoachSettings(updatedSettings);
      setCoachSettings(updatedSettings);
      return true;
    } catch (error) {
      console.error('Failed to save coach settings:', error);
      return false;
    }
  }, [user, coachSettings]);

  // AIアシスタントにコーチングプロンプトを用意する
  const prepareCoachingPrompt = useCallback(async (promptType: 'morningPlan' | 'eveningReflection' | 'weeklyReview') => {
    if (!user) return null;
    
    try {
      let systemPrompt: string;
      let userPrompt: string;
      
      const userName = user.displayName || 'お客様';
      
      switch (promptType) {
        case 'morningPlan':
          systemPrompt = coachService.getMorningPlanSystemPrompt();
          userPrompt = coachService.generateMorningPlanMessage(userName, new Date());
          break;
        case 'eveningReflection':
          // 朝に設定した目標を取得
          await loadTodayCheckin();
          const goals = todayCheckin?.morningPlan?.goals || [];
          systemPrompt = coachService.getEveningReflectionSystemPrompt();
          userPrompt = coachService.generateEveningReflectionMessage(userName, goals);
          break;
        case 'weeklyReview':
          systemPrompt = coachService.getWeeklyReviewSystemPrompt();
          userPrompt = coachService.generateWeeklyReviewMessage(userName);
          break;
      }
      
      return {
        systemPrompt,
        userPrompt
      };
    } catch (error) {
      console.error(`Failed to prepare ${promptType} prompt:`, error);
      return null;
    }
  }, [user, todayCheckin, loadTodayCheckin]);

  return {
    userGoals,
    todayCheckin,
    coachSettings,
    jitaiConfig,
    isLoading,
    loadUserGoals,
    loadTodayCheckin,
    createGoal,
    updateGoalProgress,
    saveDailyCheckin,
    toggleGoalCompletion,
    saveSettings,
    prepareCoachingPrompt,
  };
}
