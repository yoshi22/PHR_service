import AppleHealthKit, { HealthKitPermissions } from 'react-native-health';
import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';

interface HealthKitSample {
  startDate: string;
  endDate: string;
  value: number;
  device?: string;
  uuid?: string;
  metadata?: any;
}

interface DeepDebugResult {
  date: string;
  method: string;
  success: boolean;
  stepCount: number;
  rawSamples: HealthKitSample[];
  processedSamples: HealthKitSample[];
  duplicateFlags: string[];
  dateRangeIssues: string[];
  timezoneBoundaries: {
    startDate: Date;
    endDate: Date;
    startISO: string;
    endISO: string;
  };
  error?: string;
}

class StepsDataSyncServiceDeepDebug {
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

  private createDateBoundaries(dateString: string) {
    // Create date in local timezone
    const localDate = new Date(dateString + 'T00:00:00');
    
    // Create strict boundaries
    const startDate = new Date(localDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(localDate);
    endDate.setHours(23, 59, 59, 999);

    return {
      startDate,
      endDate,
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString(),
    };
  }

  private analyzeSampleDateIssues(samples: HealthKitSample[], targetDate: string): string[] {
    const issues: string[] = [];
    const boundaries = this.createDateBoundaries(targetDate);
    
    samples.forEach((sample, index) => {
      const sampleStart = new Date(sample.startDate);
      const sampleEnd = new Date(sample.endDate);
      
      // Check if sample is outside target date boundaries
      if (sampleStart < boundaries.startDate || sampleEnd > boundaries.endDate) {
        issues.push(`Sample ${index}: ${sample.startDate} to ${sample.endDate} is outside ${targetDate} boundaries`);
      }
      
      // Check for date misalignment
      const sampleDateStr = sampleStart.toISOString().split('T')[0];
      if (sampleDateStr !== targetDate) {
        issues.push(`Sample ${index}: Date ${sampleDateStr} doesn't match target ${targetDate}`);
      }
      
      // Check for suspicious duplicate values
      const duplicates = samples.filter((s, i) => i !== index && s.value === sample.value);
      if (duplicates.length > 0) {
        issues.push(`Sample ${index}: Value ${sample.value} appears ${duplicates.length + 1} times`);
      }
    });
    
    return issues;
  }

  async debugSingleDateMethod1(dateString: string): Promise<DeepDebugResult> {
    const boundaries = this.createDateBoundaries(dateString);
    
    return new Promise((resolve) => {
      const options = {
        startDate: boundaries.startISO,
        endDate: boundaries.endISO,
        includeManuallyAdded: true,
      };

      AppleHealthKit.getDailyStepCountSamples(options, (error: any, results: any) => {
        if (error) {
          resolve({
            date: dateString,
            method: 'getDailyStepCountSamples',
            success: false,
            stepCount: 0,
            rawSamples: [],
            processedSamples: [],
            duplicateFlags: [],
            dateRangeIssues: [],
            timezoneBoundaries: boundaries,
            error: error?.message || String(error),
          });
          return;
        }

        const rawSamples = results || [];
        
        // Filter samples to exact date boundaries
        const processedSamples = rawSamples.filter((sample: any) => {
          const sampleStart = new Date(sample.startDate);
          const sampleEnd = new Date(sample.endDate);
          return sampleStart >= boundaries.startDate && sampleEnd <= boundaries.endDate;
        });

        const stepCount = processedSamples.reduce((sum: number, sample: any) => sum + sample.value, 0);
        const dateRangeIssues = this.analyzeSampleDateIssues(rawSamples, dateString);
        const duplicateFlags = this.findDuplicatePatterns(processedSamples);

        resolve({
          date: dateString,
          method: 'getDailyStepCountSamples',
          success: true,
          stepCount,
          rawSamples,
          processedSamples,
          duplicateFlags,
          dateRangeIssues,
          timezoneBoundaries: boundaries,
        });
      });
    });
  }

  async debugSingleDateMethod2(dateString: string): Promise<DeepDebugResult> {
    const boundaries = this.createDateBoundaries(dateString);
    
    return new Promise((resolve) => {
      const options = {
        startDate: boundaries.startISO,
        endDate: boundaries.endISO,
        includeManuallyAdded: true,
      };

      AppleHealthKit.getStepCount(options, (error: any, results: any) => {
        if (error) {
          resolve({
            date: dateString,
            method: 'getStepCount',
            success: false,
            stepCount: 0,
            rawSamples: [],
            processedSamples: [],
            duplicateFlags: [],
            dateRangeIssues: [],
            timezoneBoundaries: boundaries,
            error: error?.message || String(error),
          });
          return;
        }

        const stepCount = results?.value || 0;

        resolve({
          date: dateString,
          method: 'getStepCount',
          success: true,
          stepCount,
          rawSamples: [], // This method doesn't return individual samples
          processedSamples: [],
          duplicateFlags: [],
          dateRangeIssues: [],
          timezoneBoundaries: boundaries,
        });
      });
    });
  }

  async debugSingleDateMethod3(dateString: string): Promise<DeepDebugResult> {
    const boundaries = this.createDateBoundaries(dateString);
    
    return new Promise((resolve) => {
      const options = {
        startDate: boundaries.startISO,
        endDate: boundaries.endISO,
        includeManuallyAdded: true,
      };

      // Use getDailyStepCountSamples for method 3 with different options
      AppleHealthKit.getDailyStepCountSamples(options, (error: any, results: any) => {
        if (error) {
          resolve({
            date: dateString,
            method: 'getSamples_Alternative',
            success: false,
            stepCount: 0,
            rawSamples: [],
            processedSamples: [],
            duplicateFlags: [],
            dateRangeIssues: [],
            timezoneBoundaries: boundaries,
            error: error?.message || String(error),
          });
          return;
        }

        const rawSamples = results || [];
        
        // Filter samples to exact date boundaries
        const processedSamples = rawSamples.filter((sample: any) => {
          const sampleStart = new Date(sample.startDate);
          const sampleEnd = new Date(sample.endDate);
          return sampleStart >= boundaries.startDate && sampleEnd <= boundaries.endDate;
        });

        const stepCount = processedSamples.reduce((sum: number, sample: any) => sum + sample.value, 0);
        const dateRangeIssues = this.analyzeSampleDateIssues(rawSamples, dateString);
        const duplicateFlags = this.findDuplicatePatterns(processedSamples);

        resolve({
          date: dateString,
          method: 'getSamples_Alternative',
          success: true,
          stepCount,
          rawSamples,
          processedSamples,
          duplicateFlags,
          dateRangeIssues,
          timezoneBoundaries: boundaries,
        });
      });
    });
  }

  private findDuplicatePatterns(samples: HealthKitSample[]): string[] {
    const patterns: string[] = [];
    const valueGroups = new Map<number, HealthKitSample[]>();
    
    // Group samples by value
    samples.forEach(sample => {
      if (!valueGroups.has(sample.value)) {
        valueGroups.set(sample.value, []);
      }
      valueGroups.get(sample.value)!.push(sample);
    });
    
    // Identify suspicious patterns
    valueGroups.forEach((group, value) => {
      if (group.length > 1) {
        patterns.push(`Value ${value} appears ${group.length} times`);
        
        // Check if samples have same device/source
        const devices = [...new Set(group.map(s => s.device || 'unknown'))];
        if (devices.length === 1 && devices[0] !== 'unknown') {
          patterns.push(`All ${group.length} samples with value ${value} from same device: ${devices[0]}`);
        }
        
        // Check for identical time ranges
        const timeRanges = group.map(s => `${s.startDate}-${s.endDate}`);
        const uniqueRanges = [...new Set(timeRanges)];
        if (uniqueRanges.length < timeRanges.length) {
          patterns.push(`Value ${value} has identical time ranges`);
        }
      }
    });
    
    return patterns;
  }

  async performDeepDebugAnalysis(dates: string[]): Promise<DeepDebugResult[]> {
    console.log('[DeepDebug] Starting deep analysis for dates:', dates);
    
    const hasPermissions = await this.requestHealthKitPermissions();
    if (!hasPermissions) {
      throw new Error('HealthKit permissions not granted');
    }

    const results: DeepDebugResult[] = [];
    
    // Test each date with all three methods
    for (const date of dates) {
      console.log(`[DeepDebug] Analyzing date: ${date}`);
      
      // Add delay between requests to prevent API overload
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const method1Result = await this.debugSingleDateMethod1(date);
      results.push(method1Result);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const method2Result = await this.debugSingleDateMethod2(date);
      results.push(method2Result);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const method3Result = await this.debugSingleDateMethod3(date);
      results.push(method3Result);
    }
    
    return results;
  }

  async saveDebugResultsToFirestore(results: DeepDebugResult[]): Promise<void> {
    try {
      // Skip Firestore save for now - focus on local debugging
      console.log('[DeepDebug] Results would be saved to Firestore:', results.length, 'items');
      console.log('[DeepDebug] Results saved locally (Firestore save skipped)');
    } catch (error) {
      console.error('[DeepDebug] Failed to save results:', error);
    }
  }

  generateDebugReport(results: DeepDebugResult[]): string {
    const report: string[] = [];
    report.push('=== DEEP DEBUG ANALYSIS REPORT ===\n');
    
    const dateGroups = new Map<string, DeepDebugResult[]>();
    results.forEach(result => {
      if (!dateGroups.has(result.date)) {
        dateGroups.set(result.date, []);
      }
      dateGroups.get(result.date)!.push(result);
    });
    
    dateGroups.forEach((dateResults, date) => {
      report.push(`\n--- DATE: ${date} ---`);
      
      const stepCounts = dateResults.map(r => ({ method: r.method, steps: r.stepCount }));
      report.push(`Step counts by method:`);
      stepCounts.forEach(({ method, steps }) => {
        report.push(`  ${method}: ${steps} steps`);
      });
      
      // Check for discrepancies
      const uniqueStepCounts = [...new Set(stepCounts.map(s => s.steps))];
      if (uniqueStepCounts.length > 1) {
        report.push(`⚠️  DISCREPANCY DETECTED: Multiple step counts for same date!`);
      }
      
      // Analyze duplicate flags
      const allDuplicateFlags = dateResults.flatMap(r => r.duplicateFlags);
      if (allDuplicateFlags.length > 0) {
        report.push(`🔍 Duplicate patterns found:`);
        allDuplicateFlags.forEach(flag => report.push(`    ${flag}`));
      }
      
      // Analyze date range issues
      const allDateIssues = dateResults.flatMap(r => r.dateRangeIssues);
      if (allDateIssues.length > 0) {
        report.push(`📅 Date range issues found:`);
        allDateIssues.forEach(issue => report.push(`    ${issue}`));
      }
      
      // Show sample counts
      dateResults.forEach(result => {
        if (result.rawSamples.length > 0) {
          report.push(`${result.method}: ${result.rawSamples.length} raw samples, ${result.processedSamples.length} processed`);
        }
      });
    });
    
    // Summary
    report.push('\n=== SUMMARY ===');
    const totalDates = dateGroups.size;
    const datesWithDiscrepancies = Array.from(dateGroups.values()).filter(dateResults => {
      const stepCounts = dateResults.map(r => r.stepCount);
      return new Set(stepCounts).size > 1;
    }).length;
    
    report.push(`Total dates analyzed: ${totalDates}`);
    report.push(`Dates with discrepancies: ${datesWithDiscrepancies}`);
    report.push(`Dates with duplicate patterns: ${Array.from(dateGroups.values()).filter(results => results.some(r => r.duplicateFlags.length > 0)).length}`);
    report.push(`Dates with date range issues: ${Array.from(dateGroups.values()).filter(results => results.some(r => r.dateRangeIssues.length > 0)).length}`);
    
    return report.join('\n');
  }
}

export default StepsDataSyncServiceDeepDebug;
