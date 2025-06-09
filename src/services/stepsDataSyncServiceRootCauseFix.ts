/**
 * Enhanced Steps Data Sync Service - Root Cause Fix
 * This version addresses the historical data duplication issue with multiple strategies
 */

import AppleHealthKit, { HealthKitPermissions } from 'react-native-health';
import firestore from '@react-native-firebase/firestore';

interface StepDataEntry {
  date: string;
  stepCount: number;
  syncTimestamp: number;
  syncMethod: string;
  validationHash: string;
  rawSamples?: any[];
}

class StepsDataSyncServiceRootCauseFix {
  private static instance: StepsDataSyncServiceRootCauseFix;
  
  public static getInstance(): StepsDataSyncServiceRootCauseFix {
    if (!StepsDataSyncServiceRootCauseFix.instance) {
      StepsDataSyncServiceRootCauseFix.instance = new StepsDataSyncServiceRootCauseFix();
    }
    return StepsDataSyncServiceRootCauseFix.instance;
  }

  private async requestHealthKitPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      const permissions: HealthKitPermissions = {
        permissions: {
          read: [AppleHealthKit.Constants.Permissions.Steps],
          write: [],
        },
      };

      AppleHealthKit.initHealthKit(permissions, (error: any) => {
        if (error) {
          console.log('[HealthKit] Permission error:', error);
          resolve(false);
        } else {
          console.log('[HealthKit] Permissions granted');
          resolve(true);
        }
      });
    });
  }

  /**
   * Create timezone-aware date boundaries that match the iPhone Health app exactly
   */
  private createPreciseDateBoundaries(dateString: string) {
    // Parse date components to avoid timezone conversion issues
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create date in device's local timezone (same as Health app)
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
    
    console.log(`[DateBoundaries] ${dateString}: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    return {
      startDate,
      endDate,
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString(),
    };
  }

  /**
   * Generate a validation hash to detect data integrity issues
   */
  private generateValidationHash(samples: any[], date: string): string {
    const sampleData = samples.map(s => `${s.startDate}:${s.endDate}:${s.value}`).sort().join('|');
    const combinedData = `${date}:${sampleData}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < combinedData.length; i++) {
      const char = combinedData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }

  /**
   * Enhanced single date step count retrieval with multiple validation layers
   */
  async getStepCountForDateEnhanced(dateString: string): Promise<StepDataEntry | null> {
    const boundaries = this.createPreciseDateBoundaries(dateString);
    
    console.log(`[Enhanced] Fetching steps for ${dateString}`);
    
    // Strategy 1: Use getDailyStepCountSamples with precise date boundaries
    const strategy1Result = await this.getStepsStrategy1(dateString, boundaries);
    
    // Add delay to prevent API rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Strategy 2: Use getStepCount with range query
    const strategy2Result = await this.getStepsStrategy2(dateString, boundaries);
    
    // Add delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Strategy 3: Use multiple narrow time windows within the day
    const strategy3Result = await this.getStepsStrategy3(dateString, boundaries);
    
    // Cross-validate all strategies
    const validatedResult = this.crossValidateStrategies(
      strategy1Result, 
      strategy2Result, 
      strategy3Result, 
      dateString
    );
    
    return validatedResult;
  }

  private async getStepsStrategy1(dateString: string, boundaries: any): Promise<StepDataEntry | null> {
    return new Promise((resolve) => {
      const options = {
        startDate: boundaries.startISO,
        endDate: boundaries.endISO,
        includeManuallyAdded: true,
      };

      AppleHealthKit.getDailyStepCountSamples(options, (error: any, results: any) => {
        if (error) {
          console.error(`[Strategy1] Error for ${dateString}:`, error);
          resolve(null);
          return;
        }

        const samples = results || [];
        
        // Ultra-strict filtering: only include samples that fall exactly within the date
        const strictFilteredSamples = samples.filter((sample: any) => {
          const sampleStart = new Date(sample.startDate);
          const sampleEnd = new Date(sample.endDate);
          
          // Check if sample is completely within the target date
          const sampleDateStr = sampleStart.toISOString().split('T')[0];
          const isCorrectDate = sampleDateStr === dateString;
          const isWithinBounds = sampleStart >= boundaries.startDate && sampleEnd <= boundaries.endDate;
          
          if (!isCorrectDate) {
            console.warn(`[Strategy1] Rejecting sample from ${sampleDateStr} for target ${dateString}`);
          }
          
          return isCorrectDate && isWithinBounds;
        });

        const stepCount = strictFilteredSamples.reduce((sum: number, sample: any) => sum + sample.value, 0);
        const validationHash = this.generateValidationHash(strictFilteredSamples, dateString);

        console.log(`[Strategy1] ${dateString}: ${stepCount} steps (${strictFilteredSamples.length} samples)`);

        resolve({
          date: dateString,
          stepCount,
          syncTimestamp: Date.now(),
          syncMethod: 'strategy1_getDailyStepCountSamples',
          validationHash,
          rawSamples: strictFilteredSamples,
        });
      });
    });
  }

  private async getStepsStrategy2(dateString: string, boundaries: any): Promise<StepDataEntry | null> {
    return new Promise((resolve) => {
      const options = {
        startDate: boundaries.startISO,
        endDate: boundaries.endISO,
        includeManuallyAdded: true,
      };

      AppleHealthKit.getStepCount(options, (error: any, results: any) => {
        if (error) {
          console.error(`[Strategy2] Error for ${dateString}:`, error);
          resolve(null);
          return;
        }

        const stepCount = results?.value || 0;
        
        console.log(`[Strategy2] ${dateString}: ${stepCount} steps (aggregated)`);

        resolve({
          date: dateString,
          stepCount,
          syncTimestamp: Date.now(),
          syncMethod: 'strategy2_getStepCount',
          validationHash: `aggregated_${stepCount}`,
        });
      });
    });
  }

  private async getStepsStrategy3(dateString: string, boundaries: any): Promise<StepDataEntry | null> {
    // Break the day into 4-hour windows to avoid potential caching issues
    const windows = [];
    const startTime = boundaries.startDate.getTime();
    const windowSize = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
    
    for (let i = 0; i < 6; i++) { // 6 windows of 4 hours = 24 hours
      const windowStart = new Date(startTime + (i * windowSize));
      const windowEnd = new Date(Math.min(startTime + ((i + 1) * windowSize), boundaries.endDate.getTime()));
      windows.push({ start: windowStart, end: windowEnd });
    }
    
    let totalSteps = 0;
    const allSamples: any[] = [];
    
    for (const window of windows) {
      const windowResult = await new Promise<any[]>((resolve) => {
        const options = {
          startDate: window.start.toISOString(),
          endDate: window.end.toISOString(),
          includeManuallyAdded: true,
        };

        AppleHealthKit.getDailyStepCountSamples(options, (error: any, results: any) => {
          if (error) {
            console.error(`[Strategy3] Window error for ${dateString}:`, error);
            resolve([]);
            return;
          }

          const samples = results || [];
          resolve(samples);
        });
      });
      
      // Filter samples to ensure they belong to the target date
      const dateSamples = windowResult.filter((sample: any) => {
        const sampleDateStr = new Date(sample.startDate).toISOString().split('T')[0];
        return sampleDateStr === dateString;
      });
      
      allSamples.push(...dateSamples);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between windows
    }
    
    // Remove duplicates (samples that might appear in multiple windows)
    const uniqueSamples = allSamples.filter((sample, index, arr) => {
      return arr.findIndex(s => s.startDate === sample.startDate && s.endDate === sample.endDate) === index;
    });
    
    totalSteps = uniqueSamples.reduce((sum: number, sample: any) => sum + sample.value, 0);
    const validationHash = this.generateValidationHash(uniqueSamples, dateString);
    
    console.log(`[Strategy3] ${dateString}: ${totalSteps} steps (${uniqueSamples.length} samples, ${windows.length} windows)`);
    
    return {
      date: dateString,
      stepCount: totalSteps,
      syncTimestamp: Date.now(),
      syncMethod: 'strategy3_windowedQuery',
      validationHash,
      rawSamples: uniqueSamples,
    };
  }

  private crossValidateStrategies(
    strategy1: StepDataEntry | null, 
    strategy2: StepDataEntry | null, 
    strategy3: StepDataEntry | null, 
    dateString: string
  ): StepDataEntry | null {
    
    const results = [strategy1, strategy2, strategy3].filter(r => r !== null) as StepDataEntry[];
    
    if (results.length === 0) {
      console.error(`[CrossValidate] No valid results for ${dateString}`);
      return null;
    }
    
    const stepCounts = results.map(r => r.stepCount);
    const uniqueStepCounts = [...new Set(stepCounts)];
    
    console.log(`[CrossValidate] ${dateString}: Step counts: [${stepCounts.join(', ')}]`);
    
    if (uniqueStepCounts.length === 1) {
      // All strategies agree - use strategy1 as it has the most detail
      console.log(`✅ [CrossValidate] All strategies agree: ${uniqueStepCounts[0]} steps`);
      return strategy1 || results[0];
    } else {
      // Discrepancy detected - investigate
      console.warn(`⚠️ [CrossValidate] Discrepancy detected for ${dateString}`);
      
      // Prefer strategy3 (windowed query) as it's least likely to be affected by caching
      const preferredResult = strategy3 || strategy1 || strategy2;
      
      // Log the discrepancy for analysis
      console.warn(`[CrossValidate] Using ${preferredResult?.syncMethod}: ${preferredResult?.stepCount} steps`);
      
      return preferredResult;
    }
  }

  /**
   * Enhanced sync function that processes dates individually with validation
   */
  async syncStepsDataEnhanced(days: number = 30): Promise<void> {
    console.log(`[EnhancedSync] Starting sync for last ${days} days`);
    
    const hasPermissions = await this.requestHealthKitPermissions();
    if (!hasPermissions) {
      throw new Error('HealthKit permissions not granted');
    }

    const today = new Date();
    const dates: string[] = [];
    
    // Generate date strings for the last N days
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    
    console.log(`[EnhancedSync] Processing dates: ${dates.join(', ')}`);
    
    // Process each date individually with delays
    for (const dateString of dates) {
      try {
        console.log(`\n[EnhancedSync] Processing ${dateString}...`);
        
        const stepData = await this.getStepCountForDateEnhanced(dateString);
        
        if (stepData) {
          await this.saveStepDataToFirestore(stepData);
          console.log(`✅ [EnhancedSync] ${dateString}: ${stepData.stepCount} steps saved`);
        } else {
          console.warn(`⚠️ [EnhancedSync] No data for ${dateString}`);
        }
        
        // Add delay between dates to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ [EnhancedSync] Error processing ${dateString}:`, error);
      }
    }
    
    console.log(`[EnhancedSync] Sync completed for ${days} days`);
  }

  private async saveStepDataToFirestore(stepData: StepDataEntry): Promise<void> {
    // Implementation would depend on your Firestore setup
    // For now, just log the data
    console.log(`[Firestore] Would save:`, {
      date: stepData.date,
      stepCount: stepData.stepCount,
      syncMethod: stepData.syncMethod,
      validationHash: stepData.validationHash,
      timestamp: stepData.syncTimestamp,
    });
  }
}

export default StepsDataSyncServiceRootCauseFix;
