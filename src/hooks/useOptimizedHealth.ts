import { useState, useEffect, useCallback } from 'react';
import { getTodayStepsWithSourceInfo, analyzeMiBandDataSources } from '../services/healthService';

export interface OptimizedHealthData {
  steps: number;
  sourceInfo?: string;
  hasMiBandData?: boolean;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

export function useOptimizedHealth() {
  const [data, setData] = useState<OptimizedHealthData>({
    steps: 0,
    sourceInfo: undefined,
    hasMiBandData: false,
    loading: true,
    error: null,
    refreshing: false,
  });

  const fetchHealthData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setData(prev => ({ ...prev, refreshing: true, error: null }));
      } else {
        setData(prev => ({ ...prev, loading: true, error: null }));
      }

      // Mi Band統合による最適化データ取得
      const result = await getTodayStepsWithSourceInfo();

      setData({
        steps: result.steps,
        sourceInfo: result.sourceInfo,
        hasMiBandData: result.hasMiBandData,
        loading: false,
        error: null,
        refreshing: false,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '健康データの取得に失敗しました';
      
      setData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        refreshing: false,
      }));
    }
  }, []);

  const refresh = useCallback(() => {
    return fetchHealthData(true);
  }, [fetchHealthData]);

  const analyzeSources = useCallback(async () => {
    try {
      const analysis = await analyzeMiBandDataSources();
      return analysis;
    } catch (error) {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  return {
    ...data,
    refresh,
    analyzeSources,
  };
}