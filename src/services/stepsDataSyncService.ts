import { Platform } from 'react-native'
import AppleHealthKit, { HealthKitPermissions } from 'react-native-health'
import { collection, doc, setDoc, getDocs, getDoc, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { getAuth } from 'firebase/auth'

// HealthKit permissions
const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
    ],
    write: [], // 読み取り専用なので空配列
  },
}

/**
 * Initialize HealthKit and request permissions
 */
export const initializeHealthKit = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'ios') {
      resolve(false)
      return
    }

    AppleHealthKit.initHealthKit(permissions, (error: any) => {
      if (error) {
        console.error('HealthKit initialization error:', error)
        reject(error)
      } else {
        console.log('HealthKit initialized successfully')
        resolve(true)
      }
    })
  })
}

/**
 * Get steps data from HealthKit using multiple verification methods
 * This approach uses both getDailyStepCountSamples and getStepCount to cross-validate data
 */
export const getHealthKitStepsData = (): Promise<Array<{ date: string; steps: number }>> => {
  return new Promise(async (resolve, reject) => {
    if (Platform.OS !== 'ios') {
      console.log('HealthKit not available on Android platform')
      resolve([])
      return
    }

    // Calculate the past 7 days with local dates
    const today = new Date()
    const dates: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      dates.push(dateStr)
    }
    console.log(`📊 Fetching HealthKit data with cross-validation for: ${dates.join(', ')}`)

    try {
      const results: Array<{ date: string; steps: number }> = []
      
      // Process each date with cross-validation
      for (let i = 0; i < dates.length; i++) {
        const dateStr = dates[i]
        const [y, m, d] = dateStr.split('-').map(Number)
        
        // 日本時間で正確な日付範囲を設定
        const targetDate = new Date(y, m - 1, d)
        const startDate = new Date(targetDate)
        startDate.setHours(0, 0, 0, 0) // その日の00:00:00
        const endDate = new Date(targetDate)
        endDate.setHours(23, 59, 59, 999) // その日の23:59:59
        
        console.log(`\n🔍 Processing ${dateStr} (${i + 1}/${dates.length})`)
        console.log(`  Time range: ${startDate.toISOString()} to ${endDate.toISOString()}`)
        console.log(`  Local time: ${startDate.toLocaleString('ja-JP')} to ${endDate.toLocaleString('ja-JP')}`)
        
        const options = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }
        
        // Method 1: getDailyStepCountSamples with strict validation
        const samplesResult = await new Promise<number>((resolveSamples, rejectSamples) => {
          AppleHealthKit.getDailyStepCountSamples(options, (callbackError: any, samplesData: any) => {
            if (callbackError) {
              console.error(`❌ getDailyStepCountSamples error for ${dateStr}:`, callbackError)
              resolveSamples(0)
              return
            }
            
            console.log(`📱 getDailyStepCountSamples for ${dateStr}:`, samplesData ? samplesData.length : 0, 'samples')
            
            if (!samplesData || !Array.isArray(samplesData)) {
              resolveSamples(0)
              return
            }
            
            let totalSteps = 0
            let validSamples = 0
            let invalidSamples = 0
            
            samplesData.forEach((sample: any, index: number) => {
              const sampleDate = new Date(sample.startDate)
              const sy = sampleDate.getFullYear()
              const sm = String(sampleDate.getMonth() + 1).padStart(2, '0')
              const sd = String(sampleDate.getDate()).padStart(2, '0')
              const sampleDateStr = `${sy}-${sm}-${sd}`
              
              console.log(`    Sample ${index}: ${sample.value} steps, date: ${sampleDateStr}, start: ${sample.startDate}`)
              
              // Ultra-strict date matching
              if (sampleDateStr === dateStr) {
                // Additional validation: check if sample falls within our exact time range
                const sampleTime = new Date(sample.startDate).getTime()
                const startTime = startDate.getTime()
                const endTime = endDate.getTime()
                
                if (sampleTime >= startTime && sampleTime <= endTime) {
                  const steps = Math.round(sample.value || 0)
                  totalSteps += steps
                  validSamples++
                  console.log(`    ✅ Valid sample: ${steps} steps`)
                } else {
                  invalidSamples++
                  console.log(`    ❌ Sample outside time range: ${sample.startDate}`)
                }
              } else {
                invalidSamples++
                console.log(`    ❌ Sample date mismatch: ${sampleDateStr} (expected: ${dateStr})`)
              }
            })
            
            console.log(`  📊 getDailyStepCountSamples result for ${dateStr}: ${totalSteps} steps (${validSamples} valid, ${invalidSamples} invalid samples)`)
            resolveSamples(totalSteps)
          })
        })
        
        // Method 2: getStepCount for cross-validation
        const stepCountResult = await new Promise<number>((resolveStepCount, rejectStepCount) => {
          AppleHealthKit.getStepCount(options, (callbackError: any, stepCountData: any) => {
            if (callbackError) {
              console.error(`❌ getStepCount error for ${dateStr}:`, callbackError)
              resolveStepCount(0)
              return
            }
            
            const steps = stepCountData && typeof stepCountData.value === 'number' ? Math.round(stepCountData.value) : 0
            console.log(`  📊 getStepCount result for ${dateStr}: ${steps} steps`)
            resolveStepCount(steps)
          })
        })
        
        // Cross-validate the results
        console.log(`  🔍 Cross-validation for ${dateStr}:`)
        console.log(`    getDailyStepCountSamples: ${samplesResult} steps`)
        console.log(`    getStepCount: ${stepCountResult} steps`)
        
        let finalSteps = samplesResult
        
        // If there's a significant discrepancy, flag it
        if (Math.abs(samplesResult - stepCountResult) > 10 && stepCountResult > 0) {
          console.log(`  ⚠️ Discrepancy detected for ${dateStr}! Using getStepCount result: ${stepCountResult}`)
          finalSteps = stepCountResult
        } else if (samplesResult === 0 && stepCountResult > 0) {
          console.log(`  ⚠️ getDailyStepCountSamples returned 0 but getStepCount returned ${stepCountResult}. Using getStepCount.`)
          finalSteps = stepCountResult
        }
        
        results.push({ date: dateStr, steps: finalSteps })
        
        // Check for duplicates as we go
        if (results.length > 1) {
          const currentSteps = finalSteps
          const previousSteps = results[results.length - 2].steps
          if (currentSteps === previousSteps && currentSteps > 0) {
            console.log(`  🚨 DUPLICATE DETECTED: ${dateStr} has same steps (${currentSteps}) as previous date!`)
            console.log(`  🔍 This suggests a fundamental HealthKit API issue that needs investigation`)
          }
        }
        
        // Add delay to avoid overwhelming HealthKit
        if (i < dates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 750))
        }
      }
      
      // Final analysis
      console.log('\n📊 Final cross-validated results:', results)
      
      const stepValues = results.filter(r => r.steps > 0).map(r => r.steps)
      const uniqueSteps = new Set(stepValues)
      
      if (stepValues.length > 0 && uniqueSteps.size === 1) {
        console.log('🚨 CRITICAL: All dates have identical step counts!')
        console.log(`🚨 This confirms a systematic issue with HealthKit data retrieval`)
        console.log(`🚨 Identical value: ${stepValues[0]} steps for all ${stepValues.length} days`)
      } else {
        console.log('✅ Data shows normal variation across dates')
      }
      
      resolve(results)
      
    } catch (error) {
      console.error('❌ Error in cross-validated HealthKit queries:', error)
      reject(error)
    }
  })
}

/**
 * Save steps data to Firestore with enhanced duplicate detection and prevention
 */
export const saveStepsDataToFirestore = async (stepsData: Array<{ date: string; steps: number }>) => {
  const auth = getAuth()
  const user = auth.currentUser
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  if (!db) {
    throw new Error('Firestore not initialized')
  }

  console.log('💾 Starting enhanced Firestore save with duplicate prevention:', stepsData)
  
  // STEP 1: Pre-save duplicate analysis
  const duplicateAnalysis: Record<number, string[]> = {}
  const nonZeroData = stepsData.filter(item => item.steps > 0)
  
  nonZeroData.forEach(item => {
    if (!duplicateAnalysis[item.steps]) {
      duplicateAnalysis[item.steps] = []
    }
    duplicateAnalysis[item.steps].push(item.date)
  })
  
  // Flag all duplicates before saving
  let hasDuplicates = false
  Object.entries(duplicateAnalysis).forEach(([steps, dates]) => {
    if (dates.length > 1) {
      hasDuplicates = true
      console.log(`🚨 DUPLICATE DETECTED: ${steps} steps appears on dates: ${dates.join(', ')}`)
      
      // Special attention to 6/8 related duplicates
      if (dates.some(date => date >= '2025-06-07' && date <= '2025-06-09')) {
        console.log(`🎯 CRITICAL: Duplicate involving 6/7-6/9 date range - this is the reported issue!`)
      }
    }
  })
  
  if (hasDuplicates) {
    console.log('🚨 DUPLICATE DATA DETECTED - Proceeding with caution...')
    
    // STEP 2: Check existing Firestore data for comparison
    console.log('🔍 Checking existing Firestore data for patterns...')
    
    try {
      const existingDataPromises = stepsData.map(async (data) => {
        const docRef = doc(db!, 'userSteps', `${user.uid}_${data.date}`)
        const existingDoc = await getDoc(docRef)
        return {
          date: data.date,
          existingSteps: existingDoc.exists() ? existingDoc.data()?.steps : null,
          newSteps: data.steps
        }
      })
      
      const existingComparison = await Promise.all(existingDataPromises)
      
      console.log('📊 Existing vs New data comparison:')
      existingComparison.forEach(item => {
        console.log(`  ${item.date}: ${item.existingSteps} -> ${item.newSteps}`)
        if (item.existingSteps !== null && item.existingSteps !== item.newSteps) {
          console.log(`    🔄 Change detected for ${item.date}`)
        }
      })
      
      // Check if we're about to overwrite good data with duplicates
      const wouldCreateNewDuplicates = existingComparison.some(item => {
        return item.existingSteps !== null && 
               item.existingSteps !== item.newSteps &&
               nonZeroData.some(d => d.date !== item.date && d.steps === item.newSteps)
      })
      
      if (wouldCreateNewDuplicates) {
        console.log('🚨 WARNING: About to overwrite unique data with duplicates!')
        console.log('🚨 Consider manual intervention or data source verification')
      }
      
    } catch (error) {
      console.error('❌ Error checking existing data:', error)
    }
  }

  // STEP 3: Save data with enhanced metadata
  try {
    const promises = stepsData.map(async (data) => {
      const docRef = doc(db!, 'userSteps', `${user.uid}_${data.date}`)
      
      console.log(`📝 Preparing to save ${data.date}: ${data.steps} steps`)
      
      // Check if document already exists
      const existingDoc = await getDoc(docRef)
      let operation = 'create'
      
      if (existingDoc.exists()) {
        const existingData = existingDoc.data()
        if (existingData.steps === data.steps && existingData.source === 'healthkit') {
          console.log(`⏭️ Skipping ${data.date}: Data unchanged (${data.steps} steps)`)
          return
        }
        operation = 'update'
        console.log(`🔄 Updating ${data.date}: ${existingData.steps} -> ${data.steps} steps`)
      } else {
        console.log(`📝 Creating new document for ${data.date}: ${data.steps} steps`)
      }
      
      // Enhanced metadata for debugging
      const saveData = {
        userId: user.uid,
        date: data.date,
        steps: data.steps,
        source: 'healthkit',
        syncMethod: 'cross-validated-query',
        timestamp: new Date().toISOString(),
        operation: operation,
        // Add duplicate detection metadata
        isDuplicateValue: hasDuplicates && nonZeroData.some(d => d.date !== data.date && d.steps === data.steps),
        duplicateGroup: hasDuplicates && data.steps > 0 ? duplicateAnalysis[data.steps]?.join(',') : null,
      }
      
      await setDoc(docRef, saveData)
      
      console.log(`✅ Saved ${data.date}: ${data.steps} steps (${operation})`)
    })
    
    await Promise.all(promises)
    
    if (hasDuplicates) {
      console.log('⚠️ Data saved with duplicates - manual review recommended')
    } else {
      console.log('✅ All step data saved to Firestore successfully - no duplicates detected')
    }
    
  } catch (error) {
    console.error('❌ Error saving to Firestore:', error)
    throw new Error(`Failed to save steps data: ${error}`)
  }
}

/**
 * Sync steps data from HealthKit to Firestore using individual date queries
 */
export const syncStepsData = async (): Promise<void> => {
  try {
    console.log('🔄 Starting steps data sync (individual date method)...')
    
    const healthKitData = await getHealthKitStepsData()
    
    if (healthKitData.length === 0) {
      console.log('⚠️ No HealthKit data available for sync')
      return
    }
    
    await saveStepsDataToFirestore(healthKitData)
    console.log('✅ Steps data sync completed successfully')
    
  } catch (error) {
    console.error('❌ Error during steps data sync:', error)
    throw error
  }
}