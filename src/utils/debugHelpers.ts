// Debug helper functions for testing and development
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppleHealthKit, { HealthKitPermissions } from 'react-native-health';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

export interface StepData {
  date: string;
  steps: number;
}

export const checkHealthServiceStatus = async () => {
  try {
    if (Platform.OS !== 'ios') {
      return { isAvailable: false, permissionsGranted: false, reason: 'Not iOS platform' };
    }

    // Try to get permissions status
    const permissions: HealthKitPermissions = {
      permissions: {
        read: [AppleHealthKit.Constants.Permissions.Steps],
        write: []
      }
    };

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: any) => {
        if (error) {
          resolve({ 
            isAvailable: true, // HealthKit is available on iOS, but permissions failed
            permissionsGranted: false, 
            error: error.message || 'HealthKit initialization failed' 
          });
        } else {
          resolve({ isAvailable: true, permissionsGranted: true });
        }
      });
    });
  } catch (error) {
    return { 
      isAvailable: false, 
      permissionsGranted: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const saveDebugInfo = async (info: any) => {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      ...info
    };
    await AsyncStorage.setItem('debug_info', JSON.stringify(debugInfo));
    console.log('✅ Debug info saved:', debugInfo);
  } catch (error) {
    console.error('❌ Failed to save debug info:', error);
  }
};

export const createTestStepsData = (): StepData[] => {
  const testData: StepData[] = [];
  const today = new Date();
  
  // Generate realistic test data for the past 7 days with no duplicates
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate realistic step counts with increasing trend towards today
    const dayOfWeek = date.getDay();
    let baseSteps;
    
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      baseSteps = 4000 + Math.floor(Math.random() * 3000); // 4000-7000
    } else { // Weekday
      baseSteps = 6000 + Math.floor(Math.random() * 4000); // 6000-10000
    }
    
    // Add trend: more recent days have slightly higher steps
    const trendBonus = Math.floor((6 - i) * 300); // 300 steps per day closer to today
    
    // Add daily variation to prevent duplicates
    const dailyVariation = Math.floor((Math.random() - 0.5) * 800); // ±400 steps variation
    
    const finalSteps = Math.max(baseSteps + trendBonus + dailyVariation, 1500); // Minimum 1500 steps
    
    testData.push({
      date: dateStr,
      steps: finalSteps
    });
  }
  
  // Ensure no duplicate step counts
  const stepCounts: Record<number, number> = {};
  testData.forEach(item => {
    stepCounts[item.steps] = (stepCounts[item.steps] || 0) + 1;
  });
  
  // Adjust duplicates
  Object.entries(stepCounts).forEach(([steps, count]) => {
    if (count > 1) {
      const duplicateIndices = testData
        .map((item, index) => item.steps === parseInt(steps) ? index : -1)
        .filter(index => index !== -1);
      
      // Adjust all but the first duplicate
      duplicateIndices.slice(1).forEach((index, adjustIndex) => {
        testData[index].steps += (adjustIndex + 1) * 100; // Add 100, 200, 300... steps
      });
    }
  });
  
  console.log('🧪 Generated unique test steps data:', testData);
  return testData;
};

export const saveTestDataToAsyncStorage = async (data?: StepData[]) => {
  try {
    const testData = data || createTestStepsData();
    await AsyncStorage.setItem('backup_steps_data', JSON.stringify(testData));
    console.log('✅ Test data saved to AsyncStorage');
    return true;
  } catch (error) {
    console.error('❌ Failed to save test data to AsyncStorage:', error);
    return false;
  }
};

export const saveTestDataToFirestore = async (data?: StepData[]) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.log('⚠️ No authenticated user, cannot save to Firestore');
      return false;
    }

    if (!db) {
      console.log('⚠️ Firestore not initialized');
      return false;
    }

    const testData = data || createTestStepsData();
    console.log('💾 Saving test data to Firestore for user:', user.uid);

    const promises = testData.map(async (stepData) => {
      const docRef = doc(db!, 'userSteps', `${user.uid}_${stepData.date}`);
      
      // Check if document already exists to avoid overwriting real data
      const existingDoc = await getDoc(docRef);
      
      if (!existingDoc.exists()) {
        await setDoc(docRef, {
          userId: user.uid,
          date: stepData.date,
          steps: stepData.steps,
          updatedAt: new Date(),
          source: 'test_data',
          syncedAt: new Date().toISOString()
        });
        console.log(`📝 Created test data for ${stepData.date}: ${stepData.steps} steps`);
      } else {
        console.log(`⏭️ Skipping ${stepData.date}: Real data already exists`);
      }
    });

    await Promise.all(promises);
    console.log('✅ Test data saved to Firestore successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to save test data to Firestore:', error);
    return false;
  }
};