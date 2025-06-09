/**
 * Focused Historical Data Duplication Analyzer
 * This script specifically targets the 6/7 and earlier date duplication issue
 */

import AppleHealthKit from 'react-native-health';

interface DateAnalysisResult {
  date: string;
  method: string;
  stepCount: number;
  sampleCount: number;
  samples: any[];
  timeRangeSpan: string;
  suspiciousPatterns: string[];
  crossDateContamination: boolean;
}

class HistoricalDataDuplicationAnalyzer {
  
  async initializeHealthKit(): Promise<boolean> {
    return new Promise((resolve) => {
      const permissions = {
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

  private createStrictDateBoundaries(dateString: string) {
    // Create date boundaries in local timezone to match iPhone Health app
    const year = parseInt(dateString.split('-')[0]);
    const month = parseInt(dateString.split('-')[1]) - 1; // Month is 0-indexed
    const day = parseInt(dateString.split('-')[2]);
    
    const startDate = new Date(year, month, day, 0, 0, 0, 0);
    const endDate = new Date(year, month, day, 23, 59, 59, 999);
    
    return {
      startDate,
      endDate,
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString(),
    };
  }

  async analyzeSingleDateHistorical(dateString: string): Promise<DateAnalysisResult[]> {
    const boundaries = this.createStrictDateBoundaries(dateString);
    const results: DateAnalysisResult[] = [];
    
    console.log(`\n🔍 Analyzing ${dateString}`);
    console.log(`📅 Boundaries: ${boundaries.startISO} to ${boundaries.endISO}`);
    
    // Method 1: getDailyStepCountSamples
    const method1Result = await new Promise<DateAnalysisResult>((resolve) => {
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
            stepCount: 0,
            sampleCount: 0,
            samples: [],
            timeRangeSpan: 'Error',
            suspiciousPatterns: [`Error: ${error?.message || String(error)}`],
            crossDateContamination: false,
          });
          return;
        }

        const samples = results || [];
        const stepCount = samples.reduce((sum: number, s: any) => sum + s.value, 0);
        
        // Analyze patterns
        const suspiciousPatterns: string[] = [];
        const crossDateContamination = this.detectCrossDateContamination(samples, dateString);
        
        if (crossDateContamination) {
          suspiciousPatterns.push('CROSS-DATE CONTAMINATION DETECTED');
        }
        
        // Check for identical values across samples
        const values = samples.map((s: any) => s.value);
        const uniqueValues = [...new Set(values)];
        if (uniqueValues.length < values.length) {
          suspiciousPatterns.push(`Duplicate values found: ${uniqueValues.length} unique out of ${values.length} total`);
        }
        
        // Check time range span
        const timeRangeSpan = this.calculateTimeRangeSpan(samples);
        
        resolve({
          date: dateString,
          method: 'getDailyStepCountSamples',
          stepCount,
          sampleCount: samples.length,
          samples,
          timeRangeSpan,
          suspiciousPatterns,
          crossDateContamination,
        });
      });
    });
    
    results.push(method1Result);
    
    // Add delay to prevent API overwhelming
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Method 2: getStepCount
    const method2Result = await new Promise<DateAnalysisResult>((resolve) => {
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
            stepCount: 0,
            sampleCount: 0,
            samples: [],
            timeRangeSpan: 'Error',
            suspiciousPatterns: [`Error: ${error?.message || String(error)}`],
            crossDateContamination: false,
          });
          return;
        }

        const stepCount = results?.value || 0;
        
        resolve({
          date: dateString,
          method: 'getStepCount',
          stepCount,
          sampleCount: 1, // This method returns aggregated count
          samples: [],
          timeRangeSpan: 'Aggregated',
          suspiciousPatterns: [],
          crossDateContamination: false,
        });
      });
    });
    
    results.push(method2Result);
    
    return results;
  }

  private detectCrossDateContamination(samples: any[], targetDate: string): boolean {
    if (!samples || samples.length === 0) return false;
    
    for (const sample of samples) {
      const sampleDate = new Date(sample.startDate).toISOString().split('T')[0];
      if (sampleDate !== targetDate) {
        console.log(`❌ Cross-date contamination: Sample from ${sampleDate} found in ${targetDate} query`);
        return true;
      }
    }
    
    return false;
  }

  private calculateTimeRangeSpan(samples: any[]): string {
    if (!samples || samples.length === 0) return 'No samples';
    
    const startTimes = samples.map((s: any) => new Date(s.startDate));
    const endTimes = samples.map((s: any) => new Date(s.endDate));
    
    const earliestStart = new Date(Math.min(...startTimes.map(d => d.getTime())));
    const latestEnd = new Date(Math.max(...endTimes.map(d => d.getTime())));
    
    const spanHours = (latestEnd.getTime() - earliestStart.getTime()) / (1000 * 60 * 60);
    
    return `${earliestStart.toLocaleTimeString()} to ${latestEnd.toLocaleTimeString()} (${spanHours.toFixed(1)}h)`;
  }

  async analyzeHistoricalDuplicationPattern(): Promise<void> {
    console.log('🚀 Starting Historical Data Duplication Analysis');
    
    const hasPermissions = await this.initializeHealthKit();
    if (!hasPermissions) {
      console.error('❌ HealthKit permissions not granted');
      return;
    }
    
    // Focus on the specific problematic dates
    const today = new Date();
    const testDates: string[] = [];
    
    // Generate the last 10 days to see the pattern
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      testDates.push(`${year}-${month}-${day}`);
    }
    
    console.log(`📊 Analyzing dates: ${testDates.join(', ')}`);
    
    const allResults: DateAnalysisResult[] = [];
    
    for (const date of testDates) {
      const dateResults = await this.analyzeSingleDateHistorical(date);
      allResults.push(...dateResults);
      
      // Print immediate results for this date
      console.log(`\n📈 Results for ${date}:`);
      dateResults.forEach(result => {
        console.log(`  ${result.method}: ${result.stepCount} steps (${result.sampleCount} samples)`);
        if (result.suspiciousPatterns.length > 0) {
          console.log(`  ⚠️  Suspicious: ${result.suspiciousPatterns.join(', ')}`);
        }
        if (result.crossDateContamination) {
          console.log(`  🚨 CROSS-DATE CONTAMINATION DETECTED!`);
        }
      });
      
      // Check for discrepancies between methods
      const method1Steps = dateResults.find(r => r.method === 'getDailyStepCountSamples')?.stepCount || 0;
      const method2Steps = dateResults.find(r => r.method === 'getStepCount')?.stepCount || 0;
      
      if (method1Steps !== method2Steps) {
        console.log(`  🔥 METHOD DISCREPANCY: Method1=${method1Steps}, Method2=${method2Steps}`);
      }
      
      // Add delay between dates
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Generate comprehensive report
    this.generateDuplicationReport(allResults, testDates);
  }

  private generateDuplicationReport(results: DateAnalysisResult[], dates: string[]): void {
    console.log('\n\n📋 HISTORICAL DUPLICATION ANALYSIS REPORT');
    console.log('='.repeat(60));
    
    // Group by date
    const dateGroups = new Map<string, DateAnalysisResult[]>();
    results.forEach(result => {
      if (!dateGroups.has(result.date)) {
        dateGroups.set(result.date, []);
      }
      dateGroups.get(result.date)!.push(result);
    });
    
    // Analyze patterns
    const duplicateDates: string[] = [];
    const crossContaminationDates: string[] = [];
    const discrepancyDates: string[] = [];
    
    dateGroups.forEach((dateResults, date) => {
      const hasDiscrepancy = dateResults.length > 1 && 
        new Set(dateResults.map(r => r.stepCount)).size > 1;
      
      const hasCrossContamination = dateResults.some(r => r.crossDateContamination);
      
      const hasSuspiciousPatterns = dateResults.some(r => r.suspiciousPatterns.length > 0);
      
      if (hasDiscrepancy) discrepancyDates.push(date);
      if (hasCrossContamination) crossContaminationDates.push(date);
      if (hasSuspiciousPatterns) duplicateDates.push(date);
    });
    
    console.log(`\n🎯 SUMMARY:`);
    console.log(`Total dates analyzed: ${dates.length}`);
    console.log(`Dates with method discrepancies: ${discrepancyDates.length}`);
    console.log(`Dates with cross-contamination: ${crossContaminationDates.length}`);
    console.log(`Dates with suspicious patterns: ${duplicateDates.length}`);
    
    if (discrepancyDates.length > 0) {
      console.log(`\n🔥 DISCREPANCY DATES: ${discrepancyDates.join(', ')}`);
    }
    
    if (crossContaminationDates.length > 0) {
      console.log(`\n🚨 CROSS-CONTAMINATION DATES: ${crossContaminationDates.join(', ')}`);
    }
    
    // Look for the duplication pattern
    console.log(`\n🔍 DUPLICATION PATTERN ANALYSIS:`);
    const stepCountsByDate = new Map<string, number[]>();
    
    dateGroups.forEach((dateResults, date) => {
      const stepCounts = dateResults.map(r => r.stepCount);
      stepCountsByDate.set(date, stepCounts);
    });
    
    // Check if recent dates have consistent data but older dates show duplication
    const sortedDates = dates.sort();
    const recentDates = sortedDates.slice(-3); // Last 3 dates
    const olderDates = sortedDates.slice(0, -3); // Earlier dates
    
    console.log(`Recent dates (${recentDates.join(', ')}):`);
    recentDates.forEach(date => {
      const counts = stepCountsByDate.get(date) || [];
      console.log(`  ${date}: ${counts.join(', ')} steps`);
    });
    
    console.log(`Older dates (${olderDates.join(', ')}):`);
    olderDates.forEach(date => {
      const counts = stepCountsByDate.get(date) || [];
      console.log(`  ${date}: ${counts.join(', ')} steps`);
    });
    
    // Check for the specific pattern: older dates showing recent date's values
    const mostRecentStepCount = stepCountsByDate.get(recentDates[recentDates.length - 1])?.[0] || 0;
    const olderDatesWithSameCount = olderDates.filter(date => {
      const counts = stepCountsByDate.get(date) || [];
      return counts.includes(mostRecentStepCount);
    });
    
    if (olderDatesWithSameCount.length > 0) {
      console.log(`\n🎯 DUPLICATION PATTERN DETECTED:`);
      console.log(`Most recent step count (${mostRecentStepCount}) appears in older dates: ${olderDatesWithSameCount.join(', ')}`);
      console.log(`This confirms the historical data duplication issue!`);
    }
  }
}

export default HistoricalDataDuplicationAnalyzer;
