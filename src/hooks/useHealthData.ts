import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useTodaySteps } from './useTodaySteps';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export interface HealthData {
  steps: number;
  heartRate?: number;
  sleepHours?: number;
  weight?: number;
  height?: number;
  activeMinutes?: number;
}

/**
 * ユーザーの健康データを取得するカスタムフック
 */
export function useHealthData() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { steps } = useTodaySteps();
  
  const fetchHealthData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 歩数データはuseTodayStepsフックから取得
      const healthDataObj: HealthData = {
        steps: steps || 0,
      };
      
      // Firestoreから追加の健康データを取得
      const userHealthDoc = await getDoc(doc(db, 'users', user.uid, 'health', 'metrics'));
      
      if (userHealthDoc.exists()) {
        const userData = userHealthDoc.data();
        
        // 各健康メトリクスを追加
        if (userData.heartRate) healthDataObj.heartRate = userData.heartRate;
        if (userData.sleepHours) healthDataObj.sleepHours = userData.sleepHours;
        if (userData.weight) healthDataObj.weight = userData.weight;
        if (userData.height) healthDataObj.height = userData.height;
        if (userData.activeMinutes) healthDataObj.activeMinutes = userData.activeMinutes;
      }
      
      setHealthData(healthDataObj);
    } catch (err) {
      console.error('健康データの取得に失敗しました', err);
      setError('健康データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user, steps]);
  
  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);
  
  return {
    healthData,
    loading,
    error,
    refreshHealthData: fetchHealthData
  };
}
