/**
 * Advanced HealthKit Raw Data Analysis Script
 * This script will help us understand exactly what data HealthKit is returning
 * and why we're seeing duplication across dates
 */

// HealthKit raw data analyzer for React Native debugging
const HEALTHKIT_DEBUG_CODE = `
// Add this to your React Native app temporarily for detailed HealthKit analysis

import AppleHealthKit from 'react-native-health';

const analyzeHealthKitRawData = () => {
  console.log('🔍 Starting comprehensive HealthKit raw data analysis');
  
  // Get data for the problematic date range
  const today = new Date();
  const dates = [];
  for (let i = 10; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(\`\${year}-\${month}-\${day}\`);
  }
  
  console.log('📅 Analyzing dates:', dates);
  
  // Method 1: Single large query to see all data at once
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 10);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);
  
  console.log('🔍 Method 1: Large date range query');
  console.log('Start:', startDate.toISOString());
  console.log('End:', endDate.toISOString());
  
  AppleHealthKit.getDailyStepCountSamples({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }, (error, results) => {
    if (error) {
      console.error('❌ Large query error:', error);
      return;
    }
    
    console.log('📊 Large query results count:', results ? results.length : 0);
    
    if (results && results.length > 0) {
      // Group by date
      const groupedByDate = {};
      results.forEach((sample, index) => {
        const sampleDate = new Date(sample.startDate);
        const dateStr = \`\${sampleDate.getFullYear()}-\${String(sampleDate.getMonth() + 1).padStart(2, '0')}-\${String(sampleDate.getDate()).padStart(2, '0')}\`;
        
        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = [];
        }
        groupedByDate[dateStr].push({
          index,
          value: sample.value,
          startDate: sample.startDate,
          endDate: sample.endDate,
          sourceId: sample.sourceId,
          sourceName: sample.sourceName
        });
      });
      
      console.log('📊 Grouped data by date:');
      Object.keys(groupedByDate).sort().forEach(date => {
        const samples = groupedByDate[date];
        const totalSteps = samples.reduce((sum, s) => sum + s.value, 0);
        console.log(\`  \${date}: \${totalSteps} total steps from \${samples.length} samples\`);
        
        // Show sample details for problematic dates
        if (date >= '2025-06-07' && date <= '2025-06-09') {
          console.log(\`    🔍 Details for \${date}:\`);
          samples.forEach((sample, i) => {
            console.log(\`      Sample \${i}: \${sample.value} steps, start: \${sample.startDate}, source: \${sample.sourceName}\`);
          });
        }
      });
      
      // Look for exact duplicates
      const stepValuesByDate = Object.keys(groupedByDate).map(date => ({
        date,
        steps: groupedByDate[date].reduce((sum, s) => sum + s.value, 0)
      }));
      
      const duplicateAnalysis = {};
      stepValuesByDate.forEach(item => {
        if (!duplicateAnalysis[item.steps]) {
          duplicateAnalysis[item.steps] = [];
        }
        duplicateAnalysis[item.steps].push(item.date);
      });
      
      console.log('🔍 Duplicate step values analysis:');
      Object.keys(duplicateAnalysis).forEach(steps => {
        const dates = duplicateAnalysis[steps];
        if (dates.length > 1) {
          console.log(\`  ⚠️ \${steps} steps appears on: \${dates.join(', ')}\`);
        }
      });
    }
  });
  
  // Method 2: Individual date queries (our current approach)
  console.log('🔍 Method 2: Individual date queries');
  
  dates.forEach((dateStr, index) => {
    setTimeout(() => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const targetDate = new Date(y, m - 1, d);
      const startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
      
      console.log(\`🔍 Individual query for \${dateStr}:\`);
      console.log(\`  Start: \${startDate.toISOString()}\`);
      console.log(\`  End: \${endDate.toISOString()}\`);
      
      AppleHealthKit.getDailyStepCountSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }, (error, results) => {
        if (error) {
          console.error(\`❌ Individual query error for \${dateStr}:\`, error);
          return;
        }
        
        console.log(\`📊 Individual query results for \${dateStr}:\`, results ? results.length : 0, 'samples');
        
        if (results && results.length > 0) {
          let totalSteps = 0;
          results.forEach((sample, i) => {
            const sampleDate = new Date(sample.startDate);
            const sampleDateStr = \`\${sampleDate.getFullYear()}-\${String(sampleDate.getMonth() + 1).padStart(2, '0')}-\${String(sampleDate.getDate()).padStart(2, '0')}\`;
            
            console.log(\`    Sample \${i}: \${sample.value} steps, sampleDate: \${sampleDateStr}, startDate: \${sample.startDate}\`);
            
            if (sampleDateStr === dateStr) {
              totalSteps += sample.value;
            } else {
              console.log(\`      ⚠️ Date mismatch! Expected \${dateStr}, got \${sampleDateStr}\`);
            }
          });
          
          console.log(\`  📊 Total steps for \${dateStr}: \${totalSteps}\`);
        } else {
          console.log(\`  📊 No data for \${dateStr}\`);
        }
      });
    }, index * 1000); // Stagger requests to avoid overwhelming HealthKit
  });
};

// Call this function from your React Native app
analyzeHealthKitRawData();
`;

console.log('📋 HealthKit Raw Data Analysis Code Generated');
console.log('');
console.log('🔧 INSTRUCTIONS:');
console.log('1. Copy the code below into a temporary component in your React Native app');
console.log('2. Call analyzeHealthKitRawData() when the app loads');
console.log('3. Check the console output for detailed HealthKit analysis');
console.log('4. Look for patterns in the raw data that might explain the duplication');
console.log('');
console.log('📋 Code to add to your React Native app:');
console.log('');
console.log(HEALTHKIT_DEBUG_CODE);
console.log('');
console.log('🎯 What to look for:');
console.log('- Are individual date queries returning samples from other dates?');
console.log('- Are the sourceId/sourceName fields different between dates?');
console.log('- Is there a timezone issue in the startDate/endDate fields?');
console.log('- Are duplicate step values coming from the same source?');
