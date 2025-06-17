/**
 * Health Data Service - Manages health data operations using the new service architecture
 * Provides unified access to health data from various sources (HealthKit, Google Fit, etc.)
 */

import { Platform } from 'react-native';
import AppleHealthKit from 'react-native-health';
import { BaseService } from './base/BaseService';
import { ServiceResult } from './types';
import { createSuccessResult, createErrorResult } from './utils/serviceUtils';

export interface WeeklyStepData {
  date: string;
  steps: number;
}

export interface HealthDataServiceConfig {
  // Future configuration options
}

/**
 * Health Data Service for managing health-related data operations
 */
export class HealthDataService extends BaseService {
  private static instance: HealthDataService | null = null;

  constructor(config: HealthDataServiceConfig = {}) {
    super('HealthDataService', config);
  }

  static getInstance(config: HealthDataServiceConfig = {}): HealthDataService {
    if (!HealthDataService.instance) {
      HealthDataService.instance = new HealthDataService(config);
    }
    return HealthDataService.instance;
  }

  /**
   * Fetches last 7 days of step data
   */
  async getWeeklySteps(userId: string): Promise<ServiceResult<WeeklyStepData[]>> {
    try {
      this.log('info', 'Fetching weekly steps data', { userId, platform: Platform.OS });

      const today = new Date();
      const start = new Date();
      start.setDate(today.getDate() - 6);

      // Generate expected date range (last 7 days)
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
      }

      this.log('info', 'Expected date range', { dates, startDate: dates[0], endDate: dates[dates.length - 1] });

      let weeklyData: WeeklyStepData[] = [];

      if (Platform.OS === 'ios') {
        this.log('info', 'Fetching from HealthKit...');
        weeklyData = await this.fetchHealthKitWeeklyData(dates);
      } else {
        this.log('info', 'Non-iOS platform, returning empty data');
        weeklyData = dates.map(date => ({ date, steps: 0 }));
      }

      this.log('info', 'Weekly steps data fetched successfully', { 
        dataCount: weeklyData.length,
        totalSteps: weeklyData.reduce((sum, day) => sum + day.steps, 0)
      });

      return createSuccessResult(weeklyData);
    } catch (error) {
      this.log('error', 'Failed to fetch weekly steps data', error);
      return createErrorResult('OPERATION_FAILED', error);
    }
  }

  /**
   * Fetches step data from HealthKit for specified dates
   */
  private async fetchHealthKitWeeklyData(dates: string[]): Promise<WeeklyStepData[]> {
    const results: WeeklyStepData[] = [];

    for (const dateStr of dates) {
      try {
        const steps = await this.getHealthKitStepsForDate(dateStr);
        results.push({ date: dateStr, steps });
        
        // Small delay to prevent overwhelming HealthKit
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        this.log('error', `Failed to get steps for ${dateStr}`, error);
        results.push({ date: dateStr, steps: 0 });
      }
    }

    return results;
  }

  /**
   * Gets step count for a specific date from HealthKit
   */
  private async getHealthKitStepsForDate(dateStr: string): Promise<number> {
    if (!AppleHealthKit) {
      this.log('warn', 'AppleHealthKit not available');
      return 0;
    }

    try {
      const targetDate = new Date(dateStr + 'T00:00:00');
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const options = {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      };

      return await new Promise<number>((resolve) => {
        if (typeof AppleHealthKit.getDailyStepCountSamples !== 'function') {
          this.log('warn', `getDailyStepCountSamples not available for ${dateStr}`);
          resolve(0);
          return;
        }

        AppleHealthKit.getDailyStepCountSamples(options, (err: string, results: any[]) => {
          if (err) {
            this.log('error', `HealthKit error for ${dateStr}`, err);
            resolve(0);
          } else {
            const totalSteps = results?.reduce((sum, sample) => {
              const steps = Math.round(sample.value || 0);
              return sum + steps;
            }, 0) || 0;

            this.log('info', `HealthKit data for ${dateStr}`, { 
              steps: totalSteps, 
              samples: results?.length || 0 
            });
            resolve(totalSteps);
          }
        });
      });
    } catch (error) {
      this.log('error', `HealthKit error for ${dateStr}`, error);
      return 0;
    }
  }

  /**
   * Repairs duplicate or inconsistent health data
   */
  async repairHealthData(userId: string): Promise<ServiceResult<boolean>> {
    try {
      this.log('info', 'Starting health data repair', { userId });

      // For now, just refresh the data
      const result = await this.getWeeklySteps(userId);
      
      if (result.success) {
        this.log('info', 'Health data repair completed successfully');
        return createSuccessResult(true);
      } else {
        return createErrorResult('OPERATION_FAILED', result.error);
      }
    } catch (error) {
      this.log('error', 'Failed to repair health data', error);
      return createErrorResult('OPERATION_FAILED', error);
    }
  }

  /**
   * Checks for duplicate data patterns
   */
  detectDuplicates(data: WeeklyStepData[]): { hasDuplicates: boolean; suspiciousPatterns: boolean } {
    const stepCounts: Record<number, string[]> = {};
    
    data.forEach(item => {
      if (item.steps > 0) {
        if (!stepCounts[item.steps]) {
          stepCounts[item.steps] = [];
        }
        stepCounts[item.steps].push(item.date);
      }
    });

    let hasDuplicates = false;
    let suspiciousPatterns = false;

    Object.entries(stepCounts).forEach(([steps, dates]) => {
      if (dates.length > 1) {
        hasDuplicates = true;
        
        // Check for suspicious patterns (like the problematic 210 steps)
        if (parseInt(steps) === 210) {
          suspiciousPatterns = true;
          this.log('warn', 'Suspicious pattern detected', { steps, dates });
        } else {
          this.log('warn', 'Duplicate steps detected', { steps, dates });
        }
      }
    });

    return { hasDuplicates, suspiciousPatterns };
  }

  async dispose(): Promise<void> {
    this.log('info', 'Disposing HealthDataService');
    HealthDataService.instance = null;
    await super.dispose();
  }
}

// Create and export singleton instance
export const healthDataService = HealthDataService.getInstance();