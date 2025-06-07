import { useState, useEffect, useCallback } from 'react'
import { Platform } from 'react-native'
import { initHealthKit, getTodayStepsIOS, initGoogleFit, getTodayStepsAndroid } from '../services/healthService'
import { saveTodaySteps } from '../services/firestoreService'
import { auth } from '../firebase'
import { saveBadge } from '../services/badgeService'
import { checkAllSpecialBadges } from '../services/specialBadgeService'
import { getUserRegistrationDate } from '../services/userProfileService'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../context/SettingsContext'

/**
 * Hook to fetch today's steps and save to Firestore.
 * Returns steps count, streak information, loading and error state.
 */
export function useTodaySteps() {
  const [steps, setSteps] = useState<number | null>(null)
  const [currentStreak, setCurrentStreak] = useState<number>(0)
  const [longestStreak, setLongestStreak] = useState<number>(0)
  const [streakStatus, setStreakStatus] = useState<string>('ストリーク記録中')
  const [isActiveToday, setIsActiveToday] = useState<boolean>(false)
  const [yesterdaySteps, setYesterdaySteps] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 認証状態を取得
  const { user, isAuthenticated } = useAuth()
  const { settings: userSettings } = useSettings() // Add settings context

  // ストリーク情報を取得する関数
  const fetchStreakInfo = useCallback(async (userId: string, stepGoal: number = 7500) => {
    if (!isAuthenticated || !user || user.uid !== userId) {
      console.log('⚠️ Cannot fetch streak info: User not authenticated or unauthorized');
      return;
    }

    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }
      
      // ユーザーの歩数履歴を日付の降順で取得
      const stepsQuery = query(
        collection(db, 'userSteps'),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(30) // 最近の30日間のデータのみ取得
      );
      
      const stepsSnapshot = await getDocs(stepsQuery);
      const stepsData = stepsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          date: data.date,
          steps: data.steps || 0,
        };
      });
      
      // 現在の日付を取得
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // 昨日の日付を取得
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      // 昨日の歩数を取得
      const yesterdayData = stepsData.find(d => d.date === yesterdayString);
      const yesterdayStepsCount = yesterdayData ? yesterdayData.steps : 0;
      setYesterdaySteps(yesterdayStepsCount);
      
      // 今日既に目標達成しているか確認
      const todayData = stepsData.find(d => d.date === todayString);
      const isTodayActive = todayData ? todayData.steps >= stepGoal : false;
      setIsActiveToday(isTodayActive);
      
      // 連続記録（ストリーク）の計算
      let currentStreakCount = 0;
      let longestStreakCount = 0;
      let tempStreak = 0;
      let isActiveStreak = true;
      
      // 日付を降順で処理して連続日数を計算
      for (let i = 0; i < 30; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const targetDateString = targetDate.toISOString().split('T')[0];
        
        const dayData = stepsData.find(d => d.date === targetDateString);
        const hasSteps = dayData && dayData.steps >= stepGoal;
        
        // 現在のストリーク計算（今日を含む）
        if (i === 0) {
          if (hasSteps) tempStreak++;
        } else if (isActiveStreak) {
          if (hasSteps) {
            tempStreak++;
          } else {
            isActiveStreak = false;
            currentStreakCount = tempStreak;
          }
        }
        
        // 最長ストリーク計算
        if (hasSteps) {
          let tempLongestStreak = 1;
          for (let j = 1; j < 30; j++) {
            const checkDate = new Date(targetDate);
            checkDate.setDate(checkDate.getDate() - j);
            const checkDateString = checkDate.toISOString().split('T')[0];
            
            const checkDayData = stepsData.find(d => d.date === checkDateString);
            if (checkDayData && checkDayData.steps >= stepGoal) {
              tempLongestStreak++;
            } else {
              break;
            }
          }
          longestStreakCount = Math.max(longestStreakCount, tempLongestStreak);
        }
      }
      
      // 最終的なストリーク値をセット
      if (isActiveStreak) {
        currentStreakCount = tempStreak;
      }
      
      setCurrentStreak(currentStreakCount);
      setLongestStreak(longestStreakCount);
      
      // ストリークのステータス設定
      if (currentStreakCount === 0) {
        setStreakStatus('ストリークなし');
      } else if (!yesterdayStepsCount || yesterdayStepsCount < stepGoal) {
        setStreakStatus('危険: 昨日の記録がありません');
      } else {
        setStreakStatus('継続中');
      }
      
    } catch (error) {
      console.error('Error fetching streak information:', error);
    }
  }, [isAuthenticated, user]);

  const fetchSteps = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Get step goal from settings context or use default
      const stepGoal = userSettings?.stepGoal || 7500;
      
      let count: number
      if (Platform.OS === 'ios') {
        await initHealthKit()
        count = await getTodayStepsIOS()
      } else {
        await initGoogleFit()
        count = await getTodayStepsAndroid()
      }
      setSteps(count)
      
      // 認証確認してからFirestoreアクセス
      if (!isAuthenticated || !user) {
        console.log('⚠️ Cannot save steps: User not authenticated');
        return;
      }
      
      await saveTodaySteps(user.uid, count)
      
      // ストリーク情報を取得（設定した歩数目標を使用）
      await fetchStreakInfo(user.uid, stepGoal)
      const today = new Date().toISOString().split('T')[0]
      
      // Regular badges: award if threshold reached
      if (count >= stepGoal) {
        await saveBadge(user.uid, today, '7500_steps')
        
        if (!db) {
          console.log('⚠️ Cannot check streak badges: Firestore not initialized');
          return;
        }
          
        // 3日連続バッジ判定
        const dates3 = [0, 1, 2].map(offset => {
          const d = new Date()
          d.setDate(d.getDate() - offset)
          return d.toISOString().split('T')[0]
        })
        const streak3Q = query(
          collection(db, 'userSteps'),
          where('userId', '==', user.uid),
          where('date', 'in', dates3)
        )
        const streak3Snap = await getDocs(streak3Q)
        const stepsList3 = streak3Snap.docs.map(d => d.data().steps as number)
        if (stepsList3.length === 3 && stepsList3.every(s => s >= stepGoal)) {
          await saveBadge(user.uid, today, '3days_streak')
        }

        // 5日連続バッジ判定
        const dates5 = [0, 1, 2, 3, 4].map(offset => {
          const d = new Date()
          d.setDate(d.getDate() - offset)
          return d.toISOString().split('T')[0]
        })
        const streak5Q = query(
          collection(db, 'userSteps'),
          where('userId', '==', user.uid),
          where('date', 'in', dates5)
        )
        const streak5Snap = await getDocs(streak5Q)
        const stepsList5 = streak5Snap.docs.map(d => d.data().steps as number)
        if (stepsList5.length === 5 && stepsList5.every(s => s >= stepGoal)) {
          await saveBadge(user.uid, today, '5days_streak')
        }
      }

      // 10000歩バッジ
      if (count >= 10000) {
        await saveBadge(user.uid, today, '10000_steps')
      }

      // Phase 2: Check all special badges
      try {
        const userRegistrationDate = await getUserRegistrationDate(user.uid)
        if (userRegistrationDate) {
          await checkAllSpecialBadges(user.uid, count, today, userRegistrationDate)
        }
      } catch (specialBadgeError) {
        console.warn('Error checking special badges:', specialBadgeError)
        // Don't fail the main flow if special badges fail
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user, fetchStreakInfo, userSettings?.stepGoal])

  useEffect(() => {
    if (isAuthenticated) {
      fetchSteps();
    }
  }, [fetchSteps, isAuthenticated]);

  return { 
    steps, 
    error, 
    loading, 
    refetch: fetchSteps,
    currentStreak,
    longestStreak,
    streakStatus,
    isActiveToday,
    yesterdaySteps
  }
}
