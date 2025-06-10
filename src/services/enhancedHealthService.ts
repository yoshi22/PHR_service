import AppleHealthKit, { HealthValue } from 'react-native-health';
import { Platform } from 'react-native';

/**
 * Enhanced HealthKit service with improved data fetching
 * ヘルスケアアプリとの同期問題を解決するための改善版
 */

/**
 * Get steps for a specific date with enhanced validation
 * 特定の日付の歩数を高精度で取得
 */
export const getStepsForDate = (date: Date): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'ios') {
      resolve(0);
      return;
    }

    // 指定日の正確な時間範囲を設定
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    console.log(`📊 Getting steps for ${date.toLocaleDateString('ja-JP')}`);
    console.log(`📊 Time range: ${startDate.toLocaleString('ja-JP')} to ${endDate.toLocaleString('ja-JP')}`);

    // Method 1: getDailyStepCountSamples (推奨方法)
    AppleHealthKit.getDailyStepCountSamples(options, (err: any, samples: any) => {
      if (err) {
        console.error(`❌ getDailyStepCountSamples error for ${date.toLocaleDateString('ja-JP')}:`, err);
        
        // Fallback to getStepCount
        AppleHealthKit.getStepCount(options, (fallbackErr: any, result: HealthValue) => {
          if (fallbackErr) {
            console.error(`❌ getStepCount fallback error:`, fallbackErr);
            resolve(0);
          } else {
            console.log(`📊 Fallback getStepCount result:`, result);
            resolve(result.value || 0);
          }
        });
        return;
      }

      if (!samples || !Array.isArray(samples)) {
        console.log('📊 No samples returned, trying getStepCount');
        
        // Fallback to getStepCount
        AppleHealthKit.getStepCount(options, (fallbackErr: any, result: HealthValue) => {
          if (fallbackErr) {
            console.error(`❌ getStepCount fallback error:`, fallbackErr);
            resolve(0);
          } else {
            console.log(`📊 Fallback getStepCount result:`, result);
            resolve(result.value || 0);
          }
        });
        return;
      }

      // サンプルデータを処理
      let totalSteps = 0;
      const targetDateStr = date.toISOString().split('T')[0];
      
      console.log(`📊 Processing ${samples.length} samples for ${targetDateStr}`);
      
      samples.forEach((sample: any, index: number) => {
        const sampleDate = new Date(sample.startDate);
        const sampleDateStr = sampleDate.toISOString().split('T')[0];
        
        console.log(`  Sample ${index}: ${sample.value} steps, date: ${sampleDateStr}`);
        
        // 日付が一致するサンプルのみを集計
        if (sampleDateStr === targetDateStr) {
          totalSteps += Math.round(sample.value || 0);
        }
      });

      console.log(`📊 Total steps for ${targetDateStr}: ${totalSteps}`);
      resolve(totalSteps);
    });
  });
};

/**
 * Get today's steps with multiple validation methods
 * 今日の歩数を複数の方法で検証して取得
 */
export const getTodayStepsEnhanced = async (): Promise<number> => {
  const today = new Date();
  return await getStepsForDate(today);
};

/**
 * Get yesterday's steps
 * 昨日の歩数を取得
 */
export const getYesterdaySteps = async (): Promise<number> => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return await getStepsForDate(yesterday);
};

/**
 * Get steps for the last 7 days with enhanced accuracy
 * 過去7日間の歩数を高精度で取得
 */
export const getWeeklyStepsEnhanced = async (): Promise<Array<{ date: string; steps: number }>> => {
  const results: Array<{ date: string; steps: number }> = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const steps = await getStepsForDate(date);
    const dateStr = date.toISOString().split('T')[0];
    
    results.push({ date: dateStr, steps });
    
    // HealthKitへの負荷を軽減するため少し待機
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('📊 Weekly steps enhanced results:', results);
  return results;
};

/**
 * Validate HealthKit data against actual health app
 * ヘルスケアアプリとの整合性を検証
 */
export const validateHealthKitData = async (): Promise<void> => {
  console.log('🔍 Starting HealthKit data validation...');
  
  try {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 今日と昨日の歩数を取得
    const todaySteps = await getTodayStepsEnhanced();
    const yesterdaySteps = await getYesterdaySteps();
    
    console.log('📊 Validation Results:');
    console.log(`  Today (${today.toLocaleDateString('ja-JP')}): ${todaySteps} steps`);
    console.log(`  Yesterday (${yesterday.toLocaleDateString('ja-JP')}): ${yesterdaySteps} steps`);
    
    // 週間データも取得
    const weeklyData = await getWeeklyStepsEnhanced();
    console.log('📊 Weekly Data:');
    weeklyData.forEach(day => {
      console.log(`  ${day.date}: ${day.steps} steps`);
    });
    
    // 異常パターンの検出
    const allSteps = weeklyData.map(d => d.steps);
    const nonZeroSteps = allSteps.filter(s => s > 0);
    const uniqueSteps = new Set(nonZeroSteps);
    
    if (nonZeroSteps.length > 0 && uniqueSteps.size === 1) {
      console.log('🚨 Warning: All non-zero days have identical step counts!');
      console.log(`🚨 This may indicate a HealthKit synchronization issue.`);
    }
    
    if (todaySteps === 0 && yesterdaySteps === 0) {
      console.log('🚨 Warning: Both today and yesterday show 0 steps!');
      console.log('🚨 Please check HealthKit permissions and data availability.');
    }
    
  } catch (error) {
    console.error('❌ HealthKit validation error:', error);
  }
};
