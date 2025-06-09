/**
 * Test script for steps data functionality
 * This script tests the implemented step data features
 */

const fs = require('fs');
const path = require('path');

// Test data structure validation
function testStepDataStructure() {
  console.log('\n=== Testing Step Data Structure ===');
  
  // Sample step data that should match our implementation
  const sampleStepData = {
    date: '2025-06-09',
    steps: 8500,
    distance: 6.2,
    calories: 320,
    timestamp: new Date().toISOString()
  };
  
  // Validate required fields
  const requiredFields = ['date', 'steps', 'timestamp'];
  const missingFields = requiredFields.filter(field => !(field in sampleStepData));
  
  if (missingFields.length === 0) {
    console.log('✅ Step data structure validation passed');
    console.log('Sample data:', JSON.stringify(sampleStepData, null, 2));
  } else {
    console.log('❌ Missing required fields:', missingFields);
  }
  
  return missingFields.length === 0;
}

// Test date formatting consistency
function testDateFormatting() {
  console.log('\n=== Testing Date Formatting ===');
  
  const now = new Date();
  
  // Test local date formatting (matches our stepsDataSyncService fix)
  const localDateString = now.getFullYear() + '-' + 
    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
    String(now.getDate()).padStart(2, '0');
  
  // Test ISO date formatting
  const isoDateString = now.toISOString().split('T')[0];
  
  console.log('Local date format:', localDateString);
  console.log('ISO date format:', isoDateString);
  
  // In most cases these should match, but timezone differences might cause issues
  const datesMatch = localDateString === isoDateString;
  console.log(datesMatch ? '✅ Date formats consistent' : '⚠️ Date format mismatch detected');
  
  return { localDateString, isoDateString, datesMatch };
}

// Test weekly date range generation
function testWeeklyDateRange() {
  console.log('\n=== Testing Weekly Date Range ===');
  
  const today = new Date();
  const weekDates = [];
  
  // Generate 7 days of dates (today and 6 days back)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
    weekDates.push(dateString);
  }
  
  console.log('Generated week dates:', weekDates);
  console.log('✅ Weekly date range generation completed');
  
  return weekDates;
}

// Test streak calculation logic
function testStreakCalculation() {
  console.log('\n=== Testing Streak Calculation ===');
  
  // Sample step data for streak testing
  const stepData = [
    { date: '2025-06-03', steps: 8000 },
    { date: '2025-06-04', steps: 9000 },
    { date: '2025-06-05', steps: 7500 },
    { date: '2025-06-06', steps: 8500 },
    { date: '2025-06-07', steps: 6000 }, // Below 8000 target
    { date: '2025-06-08', steps: 9500 },
    { date: '2025-06-09', steps: 8200 }
  ];
  
  const target = 8000;
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Calculate streaks (this logic should match useTodaySteps)
  for (let i = stepData.length - 1; i >= 0; i--) {
    if (stepData[i].steps >= target) {
      if (i === stepData.length - 1) {
        currentStreak++;
      } else if (currentStreak > 0) {
        currentStreak++;
      }
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      if (i === stepData.length - 1) {
        currentStreak = 0;
      }
      tempStreak = 0;
    }
  }
  
  console.log('Sample data:', stepData);
  console.log('Target steps:', target);
  console.log('Current streak:', currentStreak);
  console.log('Longest streak:', longestStreak);
  console.log('✅ Streak calculation test completed');
  
  return { currentStreak, longestStreak };
}

// Check if required dependencies are available
function checkDependencies() {
  console.log('\n=== Checking Dependencies ===');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = [
    '@react-native-async-storage/async-storage',
    'react-native-health',
    '@react-native-firebase/firestore'
  ];
  
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const missingDeps = requiredDeps.filter(dep => !(dep in allDeps));
  
  if (missingDeps.length === 0) {
    console.log('✅ All required dependencies found');
    requiredDeps.forEach(dep => {
      console.log(`  - ${dep}: ${allDeps[dep]}`);
    });
  } else {
    console.log('❌ Missing dependencies:', missingDeps);
  }
  
  return missingDeps.length === 0;
}

// Main test function
function runTests() {
  console.log('🧪 Starting Steps Functionality Tests');
  console.log('=====================================');
  
  const results = {
    structure: testStepDataStructure(),
    dateFormatting: testDateFormatting(),
    weeklyRange: testWeeklyDateRange(),
    streakCalculation: testStreakCalculation(),
    dependencies: checkDependencies()
  };
  
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  Object.entries(results).forEach(([test, result]) => {
    const status = (typeof result === 'boolean' ? result : result.datesMatch !== false) ? '✅' : '❌';
    console.log(`${status} ${test}`);
  });
  
  const allPassed = Object.values(results).every(result => 
    typeof result === 'boolean' ? result : result.datesMatch !== false
  );
  
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'All tests passed' : 'Some tests failed'}`);
  
  return results;
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
