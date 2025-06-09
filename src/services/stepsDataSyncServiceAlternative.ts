/**
 * Alternative HealthKit Step Data Sync Service
 * This version uses different HealthKit APIs to avoid the duplication issue
 */
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
    write: [],
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
 * Alternative method 1: Use getStepCount with precise single-day queries
 */
const getStepsForSingleDay = (dateStr: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const targetDate = new Date(y, m - 1, d)
    
    // Create very precise time boundaries
    const startDate = new Date(targetDate)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(targetDate)
    endDate.setHours(23, 59, 59, 999)
    
    console.log(`🔍 Alternative Method 1 - getStepCount for ${dateStr}`)
    console.log(`  Start: ${startDate.toISOString()}`)
    console.log(`  End: ${endDate.toISOString()}`)
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
    
    AppleHealthKit.getStepCount(options, (error: any, results: any) => {
      if (error) {
        console.error(`❌ getStepCount error for ${dateStr}:`, error)
        reject(error)
        return
      }
      
      console.log(`📊 getStepCount results for ${dateStr}:`, results)
      const steps = results && typeof results.value === 'number' ? Math.round(results.value) : 0
      console.log(`📊 Final steps for ${dateStr}: ${steps}`)
      resolve(steps)
    })
  })
}

/**
 * Alternative method 2: Use getSamples with Steps type
 */
const getStepsUsingSamples = (dateStr: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const targetDate = new Date(y, m - 1, d)
    
    const startDate = new Date(targetDate)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(targetDate)
    endDate.setHours(23, 59, 59, 999)
    
    console.log(`🔍 Alternative Method 2 - getSamples for ${dateStr}`)
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      type: AppleHealthKit.Constants.Permissions.Steps,
    }
    
    AppleHealthKit.getSamples(options, (error: any, results: any) => {
      if (error) {
        console.error(`❌ getSamples error for ${dateStr}:`, error)
        reject(error)
        return
      }
      
      console.log(`📊 getSamples results for ${dateStr}:`, results ? results.length : 0, 'samples')
      
      if (!results || !Array.isArray(results)) {
        resolve(0)
        return
      }
      
      let totalSteps = 0
      results.forEach((sample: any, index: number) => {
        const sampleDate = new Date(sample.startDate)
        const sampleDateStr = `${sampleDate.getFullYear()}-${String(sampleDate.getMonth() + 1).padStart(2, '0')}-${String(sampleDate.getDate()).padStart(2, '0')}`
        
        console.log(`  Sample ${index}: ${sample.value} steps, date: ${sampleDateStr}, start: ${sample.startDate}`)
        
        // Only count samples that exactly match our target date
        if (sampleDateStr === dateStr) {
          totalSteps += Math.round(sample.value || 0)
        } else {
          console.log(`    ⚠️ Excluding sample with wrong date: ${sampleDateStr} (expected: ${dateStr})`)
        }
      })
      
      console.log(`📊 Total steps for ${dateStr}: ${totalSteps}`)
      resolve(totalSteps)
    })
  })
}

/**
 * Main function using alternative HealthKit methods
 */
export const getHealthKitStepsDataAlternative = (): Promise<Array<{ date: string; steps: number }>> => {
  return new Promise(async (resolve, reject) => {
    if (Platform.OS !== 'ios') {
      console.log('HealthKit not available on Android platform')
      resolve([])
      return
    }

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

    console.log(`📊 Fetching HealthKit data using alternative methods for: ${dates.join(', ')}`)

    try {
      const results: Array<{ date: string; steps: number }> = []
      
      // Try both methods for comparison
      for (const dateStr of dates) {
        console.log(`\n🔍 Processing ${dateStr}...`)
        
        // Method 1: getStepCount
        let method1Steps = 0
        try {
          method1Steps = await getStepsForSingleDay(dateStr)
        } catch (error) {
          console.error(`❌ Method 1 failed for ${dateStr}:`, error)
        }
        
        // Method 2: getSamples
        let method2Steps = 0
        try {
          method2Steps = await getStepsUsingSamples(dateStr)
        } catch (error) {
          console.error(`❌ Method 2 failed for ${dateStr}:`, error)
        }
        
        console.log(`📊 ${dateStr} comparison:`)
        console.log(`  Method 1 (getStepCount): ${method1Steps} steps`)
        console.log(`  Method 2 (getSamples): ${method2Steps} steps`)
        
        // Use Method 1 (getStepCount) as it's more direct
        const finalSteps = method1Steps
        results.push({ date: dateStr, steps: finalSteps })
        
        // Flag potential duplicates
        if (results.length > 1) {
          const previousSteps = results[results.length - 2].steps
          if (finalSteps === previousSteps && finalSteps > 0) {
            console.log(`⚠️ Potential duplicate detected: ${dateStr} has same steps (${finalSteps}) as previous date`)
          }
        }
        
        // Add delay to avoid overwhelming HealthKit
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log('📊 Final alternative method results:', results)
      resolve(results)
      
    } catch (error) {
      console.error('❌ Error in alternative HealthKit methods:', error)
      reject(error)
    }
  })
}

/**
 * Alternative sync function using different HealthKit APIs
 */
export const syncStepsDataAlternative = async (): Promise<void> => {
  try {
    console.log('🔄 Starting alternative steps data sync...')
    
    const healthKitData = await getHealthKitStepsDataAlternative()
    
    if (healthKitData.length === 0) {
      console.log('⚠️ No HealthKit data available for sync')
      return
    }
    
    // Save with different source identifier
    const auth = getAuth()
    const user = auth.currentUser
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    if (!db) {
      throw new Error('Firestore not initialized')
    }

    console.log('💾 Saving alternative HealthKit data to Firestore:', healthKitData)
    
    const promises = healthKitData.map(async (data) => {
      const docRef = doc(db!, 'userSteps', `${user.uid}_${data.date}`)
      
      await setDoc(docRef, {
        userId: user.uid,
        date: data.date,
        steps: data.steps,
        source: 'healthkit-alternative',
        syncMethod: 'getStepCount-api',
        timestamp: new Date().toISOString(),
      })
      
      console.log(`✅ Saved ${data.date}: ${data.steps} steps (alternative method)`)
    })
    
    await Promise.all(promises)
    console.log('✅ Alternative steps data sync completed successfully')
    
  } catch (error) {
    console.error('❌ Error during alternative steps data sync:', error)
    throw error
  }
}
