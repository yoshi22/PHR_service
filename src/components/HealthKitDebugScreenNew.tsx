import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native'
import AppleHealthKit from 'react-native-health'
import { initializeHealthKit, getHealthKitStepsData, syncStepsData } from '../services/stepsDataSyncService'
import { useWeeklyMetrics } from '../hooks/useWeeklyMetrics'
import ConsoleLogViewer from './ConsoleLogViewer'

interface DebugResult {
  timestamp: string
  operation: string
  result: any
  error?: string
}

const HealthKitDebugScreen: React.FC = () => {
  const [debugResults, setDebugResults] = useState<DebugResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showConsole, setShowConsole] = useState(false)
  
  // Access dashboard data for comparison
  const { data: weeklyData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useWeeklyMetrics()

  const addDebugResult = (operation: string, result: any, error?: string) => {
    const debugResult: DebugResult = {
      timestamp: new Date().toLocaleTimeString(),
      operation,
      result,
      error
    }
    setDebugResults(prev => [debugResult, ...prev])
  }

  const clearResults = () => {
    setDebugResults([])
  }

  // Simple test function to verify component works
  const testBasicFunction = () => {
    setIsLoading(true)
    setTimeout(() => {
      addDebugResult('Basic Test', { message: 'Component is working!', platform: Platform.OS })
      setIsLoading(false)
    }, 1000)
  }

  // Test HealthKit initialization
  const testHealthKitInit = async () => {
    setIsLoading(true)
    try {
      const success = await initializeHealthKit()
      addDebugResult('HealthKit Initialization', { success })
    } catch (error) {
      addDebugResult('HealthKit Initialization', null, String(error))
    }
    setIsLoading(false)
  }

  // Test current step data sync
  const testCurrentSync = async () => {
    setIsLoading(true)
    try {
      const data = await getHealthKitStepsData()
      addDebugResult('Current Sync Method', data)
    } catch (error) {
      addDebugResult('Current Sync Method', null, String(error))
    }
    setIsLoading(false)
  }

  // Test fixed HealthKit API parameters - with actual API calls
  const testFixedAPIParameters = async () => {
    if (Platform.OS !== 'ios') {
      addDebugResult('Fixed API Parameters Test', null, 'Not available on Android')
      return
    }

    setIsLoading(true)
    
    try {
      const today = new Date()
      const testDate = new Date(today)
      testDate.setDate(today.getDate() - 1) // Test yesterday
      
      const year = testDate.getFullYear()
      const month = String(testDate.getMonth() + 1).padStart(2, '0')
      const day = String(testDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`

      // Test with correct parameters
      const startOfDay = new Date(testDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(testDate)
      endOfDay.setHours(23, 59, 59, 999)

      const options = {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        includeManuallyAdded: true,
      }

      console.log(`🧪 Testing fixed API parameters for ${dateStr}:`, options)

      // Test getDailyStepCountSamples with correct parameters
      AppleHealthKit.getDailyStepCountSamples(options, (error: any, results: any) => {
        if (error) {
          console.error(`❌ getDailyStepCountSamples error for ${dateStr}:`, error)
          addDebugResult(`Fixed API Test (${dateStr})`, null, `getDailyStepCountSamples error: ${error.message || error}`)
        } else {
          console.log(`✅ getDailyStepCountSamples success for ${dateStr}:`, results)
          addDebugResult(`Fixed API Test (${dateStr})`, {
            date: dateStr,
            samplesCount: results?.length || 0,
            totalSteps: results?.reduce((sum: number, sample: any) => sum + (sample.value || 0), 0) || 0,
            samples: results?.slice(0, 3) // First 3 samples for debugging
          })
        }
        setIsLoading(false)
      })

    } catch (error) {
      addDebugResult('Fixed API Parameters Test', null, String(error))
      setIsLoading(false)
    }
  }

  // Test multiple historical dates to verify fix
  const testMultipleDates = async () => {
    if (Platform.OS !== 'ios') {
      addDebugResult('Multiple Dates Test', null, 'Not available on Android')
      return
    }

    setIsLoading(true)
    
    try {
      console.log('🔍 ===== MULTI-DATE TEST STARTING =====')
      addDebugResult('Multi-Date Test STARTED', { message: 'Testing multiple dates for duplicate data issue...' })
      
      const dates = ['2025-06-08', '2025-06-07', '2025-06-06', '2025-06-05', '2025-06-04', '2025-06-03']
      const results: { [date: string]: { dailySteps: number, getStepSteps: number } } = {}
      
      for (const dateStr of dates) {
        try {
          console.log(`\n📅 Testing date: ${dateStr}`)
          addDebugResult(`=== Testing ${dateStr} ===`, { message: `Starting comprehensive test for ${dateStr}...` })
          
          // Create date boundaries for the specific date
          const targetDate = new Date(dateStr + 'T00:00:00.000Z')
          const startOfDay = new Date(targetDate)
          startOfDay.setHours(15, 0, 0, 0) // JST timezone offset
          if (startOfDay > targetDate) {
            startOfDay.setDate(startOfDay.getDate() - 1)
          }
          
          const endOfDay = new Date(startOfDay)
          endOfDay.setDate(endOfDay.getDate() + 1)
          endOfDay.setSeconds(endOfDay.getSeconds() - 1)
          
          const options = {
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString(),
            includeManuallyAdded: true,
          }
          
          console.log(`🔧 API Parameters for ${dateStr}:`, options)
          addDebugResult(`${dateStr} - API Parameters`, options)
          
          // Test getDailyStepCountSamples with correct parameters
          const dailySamples = await new Promise((resolve, reject) => {
            AppleHealthKit.getDailyStepCountSamples(options, (error: any, results: any) => {
              if (error) {
                console.error(`❌ getDailyStepCountSamples error for ${dateStr}:`, error)
                addDebugResult(`${dateStr} - getDailyStepCountSamples ERROR`, { error: error.message || error })
                reject(error)
              } else {
                const totalSteps = results?.reduce((sum: number, sample: any) => sum + (sample.value || 0), 0) || 0
                console.log(`✅ getDailyStepCountSamples success for ${dateStr}: ${totalSteps} steps from ${results?.length || 0} samples`)
                addDebugResult(`${dateStr} - getDailyStepCountSamples SUCCESS`, { 
                  steps: totalSteps, 
                  samplesCount: results?.length || 0,
                  samples: results?.slice(0, 2) // First 2 samples for reference
                })
                resolve(totalSteps)
              }
            })
          })
          
          // Fix getStepCount parameters - use same date range but with proper validation
          const getStepCountResult = await new Promise((resolve, reject) => {
            // Create a more conservative date range for getStepCount
            const simpleStart = new Date(dateStr)
            simpleStart.setHours(0, 0, 0, 0)
            
            const simpleEnd = new Date(dateStr)
            simpleEnd.setHours(23, 59, 59, 999)
            
            const simpleOptions = {
              startDate: simpleStart.toISOString(),
              endDate: simpleEnd.toISOString(),
            }
            
            console.log(`🔧 getStepCount parameters for ${dateStr}:`, simpleOptions)
            addDebugResult(`${dateStr} - getStepCount Parameters`, simpleOptions)
            
            AppleHealthKit.getStepCount(simpleOptions, (error: any, result: any) => {
              if (error) {
                console.error(`❌ getStepCount error for ${dateStr}:`, error)
                addDebugResult(`${dateStr} - getStepCount ERROR`, { 
                  error: error.message || error,
                  parameters: simpleOptions,
                  errorType: typeof error === 'string' ? 'string' : 'object'
                })
                // Don't reject, just return 0 for comparison
                resolve(0)
              } else {
                const steps = result?.value || 0
                console.log(`✅ getStepCount success for ${dateStr}: ${steps} steps`)
                addDebugResult(`${dateStr} - getStepCount SUCCESS`, { 
                  steps,
                  rawResult: result,
                  parameters: simpleOptions
                })
                resolve(steps)
              }
            })
          })
          
          results[dateStr] = {
            dailySteps: dailySamples as number,
            getStepSteps: getStepCountResult as number
          }
          
          // Add summary for this date
          const comparison = `getDailyStepCountSamples: ${dailySamples}, getStepCount: ${getStepCountResult}`
          console.log(`📊 ${dateStr} COMPARISON: ${comparison}`)
          addDebugResult(`${dateStr} - COMPARISON`, { 
            getDailyStepCountSamples: dailySamples, 
            getStepCount: getStepCountResult,
            match: dailySamples === getStepCountResult 
          })
          
          // Small delay between API calls to avoid overwhelming HealthKit
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (dateError) {
          console.error(`💥 Error testing ${dateStr}:`, dateError)
          addDebugResult(`${dateStr} - ERROR`, { error: String(dateError) })
        }
      }
      
      // Analysis Phase
      console.log('\n🔍 ===== DUPLICATE ANALYSIS =====')
      addDebugResult('DUPLICATE ANALYSIS', { message: 'Analyzing results for duplicate patterns...' })
      
      const dailyStepsValues = Object.values(results).map(r => r.dailySteps)
      const getStepValues = Object.values(results).map(r => r.getStepSteps)
      
      // Check for duplicates in getDailyStepCountSamples
      const dailyDuplicates = dailyStepsValues.filter((value, index, arr) => 
        value > 0 && arr.indexOf(value) !== index
      )
      
      // Check for duplicates in getStepCount
      const getStepDuplicates = getStepValues.filter((value, index, arr) => 
        value > 0 && arr.indexOf(value) !== index
      )
      
      console.log('📊 Daily Steps Values:', dailyStepsValues)
      console.log('📊 GetStep Values:', getStepValues)
      console.log('🔍 Daily Duplicates:', dailyDuplicates)
      console.log('🔍 GetStep Duplicates:', getStepDuplicates)
      
      addDebugResult('DUPLICATE CHECK - getDailyStepCountSamples', {
        allValues: dailyStepsValues,
        duplicates: dailyDuplicates,
        hasDuplicates: dailyDuplicates.length > 0,
        uniqueValues: [...new Set(dailyStepsValues)]
      })
      
      addDebugResult('DUPLICATE CHECK - getStepCount', {
        allValues: getStepValues,
        duplicates: getStepDuplicates,
        hasDuplicates: getStepDuplicates.length > 0,
        uniqueValues: [...new Set(getStepValues)]
      })
      
      // Final summary
      if (dailyDuplicates.length === 0 && getStepDuplicates.length === 0) {
        console.log('🎉 SUCCESS: No duplicates found! API fix appears to be working.')
        addDebugResult('✅ TEST RESULT: SUCCESS', { 
          message: 'No duplicate step counts found across dates!',
          status: 'FIXED'
        })
      } else {
        console.log('⚠️ WARNING: Duplicates still detected. API fix may need additional work.')
        addDebugResult('❌ TEST RESULT: DUPLICATES DETECTED', {
          message: 'Duplicate step counts still present across dates',
          dailyDuplicates: dailyDuplicates.length,
          getStepDuplicates: getStepDuplicates.length,
          status: 'NEEDS_FIX'
        })
      }
      
      console.log('🔍 ===== MULTI-DATE TEST COMPLETED =====\n')
      addDebugResult('Multi-Date Test COMPLETED', { 
        message: 'All dates tested. Check console logs for detailed analysis.',
        testedDates: dates.length,
        resultsAnalyzed: Object.keys(results).length
      })
      
    } catch (error) {
      console.error('💥 Multiple Dates Test ERROR:', error)
      addDebugResult('Multiple Dates Test ERROR', { failed: true }, error?.toString())
    } finally {
      setIsLoading(false)
    }
  }

  // Test dashboard data comparison
  const testDashboardComparison = async () => {
    setIsLoading(true)
    
    try {
      console.log('\n🏠 ===== DASHBOARD DATA ANALYSIS =====')
      addDebugResult('Dashboard Analysis STARTED', { message: 'Analyzing current dashboard data for duplicates...' })
      
      // Refresh dashboard data first
      console.log('🔄 Refreshing dashboard data...')
      await refetchDashboard()
      
      console.log('📊 Current Dashboard Data:', weeklyData)
      addDebugResult('Current Dashboard Data', {
        totalEntries: weeklyData.length,
        data: weeklyData,
        loading: dashboardLoading,
        error: dashboardError
      })
      
      if (weeklyData.length === 0) {
        console.log('⚠️ No dashboard data available')
        addDebugResult('Dashboard Warning', { message: 'No weekly data available for analysis' })
        return
      }
      
      // Analyze for duplicates
      const stepCounts = weeklyData.map(item => item.steps)
      const duplicateSteps = stepCounts.filter((steps, index, arr) => 
        steps > 0 && arr.indexOf(steps) !== index
      )
      
      const uniqueSteps = [...new Set(stepCounts)]
      
      console.log('📊 Dashboard Step Counts:', stepCounts)
      console.log('🔍 Duplicate Steps Found:', duplicateSteps)
      console.log('✨ Unique Step Counts:', uniqueSteps)
      
      addDebugResult('Dashboard Duplicate Analysis', {
        allStepCounts: stepCounts,
        duplicates: duplicateSteps,
        hasDuplicates: duplicateSteps.length > 0,
        uniqueCounts: uniqueSteps,
        duplicatePercentage: stepCounts.length > 0 ? (duplicateSteps.length / stepCounts.length * 100).toFixed(1) + '%' : '0%'
      })
      
      // Detailed date-by-date analysis
      weeklyData.forEach((item, index) => {
        const duplicateCount = stepCounts.filter(steps => steps === item.steps).length
        const isDuplicate = duplicateCount > 1
        
        console.log(`📅 ${item.date}: ${item.steps} steps ${isDuplicate ? '⚠️ (DUPLICATE)' : '✅ (UNIQUE)'} - appears ${duplicateCount} times`)
        
        addDebugResult(`${item.date} Analysis`, {
          date: item.date,
          steps: item.steps,
          isDuplicate,
          duplicateCount,
          status: isDuplicate ? 'DUPLICATE' : 'UNIQUE'
        })
      })
      
      // Summary
      if (duplicateSteps.length === 0) {
        console.log('🎉 Dashboard SUCCESS: No duplicate step counts found!')
        addDebugResult('✅ Dashboard Result: SUCCESS', { 
          message: 'No duplicate step counts in dashboard data!',
          status: 'FIXED'
        })
      } else {
        console.log(`⚠️ Dashboard WARNING: ${duplicateSteps.length} duplicate step counts detected`)
        addDebugResult('❌ Dashboard Result: DUPLICATES FOUND', {
          message: `${duplicateSteps.length} duplicate step counts detected in dashboard`,
          duplicateCount: duplicateSteps.length,
          totalEntries: weeklyData.length,
          status: 'NEEDS_FIX'
        })
      }
      
      console.log('🏠 ===== DASHBOARD ANALYSIS COMPLETED =====\n')
      
    } catch (error) {
      console.error('💥 Dashboard Analysis ERROR:', error)
      addDebugResult('Dashboard Analysis ERROR', { failed: true }, error?.toString())
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HealthKit Debug Tools</Text>
      
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, !showConsole && styles.activeToggle]} 
          onPress={() => setShowConsole(false)}
        >
          <Text style={[styles.toggleText, !showConsole && styles.activeToggleText]}>
            Results
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, showConsole && styles.activeToggle]} 
          onPress={() => setShowConsole(true)}
        >
          <Text style={[styles.toggleText, showConsole && styles.activeToggleText]}>
            Console Logs
          </Text>
        </TouchableOpacity>
      </View>
      
      {!showConsole && (
        <>
          <ScrollView style={styles.buttonContainer} horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.button} onPress={testBasicFunction} disabled={isLoading}>
              <Text style={styles.buttonText}>Basic Test</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={testHealthKitInit} disabled={isLoading}>
              <Text style={styles.buttonText}>Init</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={testCurrentSync} disabled={isLoading}>
              <Text style={styles.buttonText}>Current Sync</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={testFixedAPIParameters} disabled={isLoading}>
              <Text style={styles.buttonText}>🔧 Test Fixed API</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.multiTestButton]} onPress={testMultipleDates} disabled={isLoading}>
              <Text style={styles.buttonText}>📅 Multi-Date Test</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.dashboardButton]} onPress={testDashboardComparison} disabled={isLoading}>
              <Text style={styles.buttonText}>🏠 Dashboard Test</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
          </ScrollView>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Testing...</Text>
            </View>
          )}

          <ScrollView style={styles.resultsContainer}>
            {debugResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.resultTimestamp}>{result.timestamp}</Text>
                <Text style={styles.resultOperation}>{result.operation}</Text>
                
                {result.error ? (
                  <Text style={styles.resultError}>Error: {result.error}</Text>
                ) : (
                  <Text style={styles.resultSuccess} numberOfLines={6} ellipsizeMode="tail">
                    {JSON.stringify(result.result, null, 2)}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </>
      )}
      
      {showConsole && <ConsoleLogViewer />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e1e5e9',
    borderRadius: 8,
    marginBottom: 16,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeToggleText: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    maxHeight: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
  },
  multiTestButton: {
    backgroundColor: '#34C759',
  },
  dashboardButton: {
    backgroundColor: '#5856D6',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  resultTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resultOperation: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  resultSuccess: {
    fontSize: 12,
    color: '#28A745',
    fontFamily: 'Courier',
  },
  resultError: {
    fontSize: 12,
    color: '#DC3545',
  },
})

export default HealthKitDebugScreen
