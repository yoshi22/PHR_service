// Local steps data hook - fetches backup step data from AsyncStorage
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalStepData {
  date: string;
  steps: number;
}

const BACKUP_STEPS_KEY = 'backup_steps_data';

export const useLocalStepsData = () => {
  const [stepsData, setStepsData] = useState<LocalStepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLocalData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const storedData = await AsyncStorage.getItem(BACKUP_STEPS_KEY);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData) as LocalStepData[];
        
        // Validate data structure
        const validData = parsedData.filter(item => 
          item && 
          typeof item.date === 'string' && 
          typeof item.steps === 'number' && 
          item.steps >= 0
        );
        
        console.log('📱 Loaded local step data:', validData);
        setStepsData(validData);
      } else {
        console.log('📱 No local step data found');
        setStepsData([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load local data';
      console.error('❌ Error loading local step data:', errorMessage);
      setError(errorMessage);
      setStepsData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    return loadLocalData();
  }, [loadLocalData]);

  useEffect(() => {
    loadLocalData();
  }, [loadLocalData]);

  return {
    stepsData,
    loading,
    error,
    refetch
  };
};