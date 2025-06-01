import { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import { 
  getStreakProtection, 
  useStreakProtection as useProtection,
  StreakProtection,
  getDaysUntilNextRefill,
  checkAndRefillProtection
} from '../services/streakProtectionService';
import { useTodaySteps } from './useTodaySteps';
import { useAuth } from '../contexts/AuthContext';

export function useStreakProtection() {
  const [protection, setProtection] = useState<StreakProtection | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isInRiskZone, setIsInRiskZone] = useState<boolean>(false);
  const [daysUntilNextRefill, setDaysUntilNextRefill] = useState<number>(0);
  
  // 認証状態を取得
  const { user, isAuthenticated } = useAuth();
  
  // 歩数データから状態を判断するために利用
  const { currentStreak, yesterdaySteps } = useTodaySteps();

  // ストリーク保護の情報を取得
  const fetchProtection = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('⚠️ Cannot fetch streak protection: User not authenticated');
      return;
    }
    
    setLoading(true);
    try {
      const data = await getStreakProtection(user.uid);
      if (data) {
        setProtection(data);
        setDaysUntilNextRefill(getDaysUntilNextRefill(data));
      }
      
      // 保護の補充をチェック
      await checkAndRefillProtection(user.uid);
    } catch (error) {
      console.error('Error fetching streak protection:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // 「危険状態」を判断（前日の記録がない場合）
  useEffect(() => {
    // 前日の歩数が0の場合は危険状態
    if (yesterdaySteps === 0 && currentStreak > 0) {
      setIsInRiskZone(true);
    } else {
      setIsInRiskZone(false);
    }
  }, [yesterdaySteps, currentStreak]);

  // 初期ロード時に保護情報を取得
  useEffect(() => {
    if (isAuthenticated) {
      fetchProtection();
    }
  }, [fetchProtection, isAuthenticated]);

  // ストリーク保護を使用する関数
  const handleUseProtection = async (): Promise<boolean> => {
    if (!isAuthenticated || !user || !isInRiskZone) {
      console.log('⚠️ Cannot use streak protection: Not authenticated or not in risk zone');
      return false;
    }
    
    try {
      const success = await useProtection(user.uid);
      if (success) {
        // 保護情報を更新
        await fetchProtection();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error using streak protection:', error);
      return false;
    }
  };

  return {
    protection,
    loading,
    isInRiskZone,
    daysUntilNextRefill,
    useProtection: handleUseProtection,
    refreshProtection: fetchProtection
  };
}
