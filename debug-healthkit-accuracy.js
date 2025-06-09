/**
 * Debug script to check what actual HealthKit data vs corrected data looks like
 */

console.log('='.repeat(60));
console.log('HEALTHKIT DATA ACCURACY CHECK');
console.log('='.repeat(60));

// Simulate current data flow
function simulateCurrentDataFlow() {
    console.log('\n📱 SIMULATED HEALTHKIT RAW DATA (what iPhone Health app shows):');
    
    // This represents what the user sees in iPhone Health app
    const actualHealthKitData = [
        { date: '2025-06-03', steps: 7200 },
        { date: '2025-06-04', steps: 6800 },
        { date: '2025-06-05', steps: 8200 },
        { date: '2025-06-06', steps: 7500 },
        { date: '2025-06-07', steps: 8461 }, // User mentioned this should be 8461
        { date: '2025-06-08', steps: 6900 },
        { date: '2025-06-09', steps: 7800 },
    ];
    
    actualHealthKitData.forEach(item => {
        console.log(`  ${item.date}: ${item.steps.toLocaleString()} steps`);
    });
    
    console.log('\n🔧 CURRENT CORRECTION LOGIC APPLIED:');
    
    // Simulate current duplicate detection
    const stepCounts = {};
    actualHealthKitData.forEach(item => {
        if (!stepCounts[item.steps]) {
            stepCounts[item.steps] = [];
        }
        stepCounts[item.steps].push(item.date);
    });
    
    // Find duplicates (even if they are real)
    const duplicates = Object.entries(stepCounts).filter(([count, dates]) => dates.length > 1);
    
    if (duplicates.length > 0) {
        console.log('  ⚠️ Current logic detects "duplicates" even for valid data:');
        duplicates.forEach(([stepCount, dates]) => {
            console.log(`    ${stepCount} steps found for dates: ${dates.join(', ')}`);
        });
        
        // Apply current correction
        duplicates.forEach(([stepCount, dates]) => {
            const count = parseInt(stepCount);
            const sortedDates = dates.sort();
            
            sortedDates.forEach((date, index) => {
                if (index < sortedDates.length - 1) {
                    const reduction = (sortedDates.length - 1 - index) * 0.15;
                    const correctedSteps = Math.max(
                        Math.floor(count * (1 - reduction)),
                        Math.floor(count * 0.5)
                    );
                    
                    const dataItem = actualHealthKitData.find(item => item.date === date);
                    if (dataItem) {
                        console.log(`    INCORRECTLY CORRECTING: ${date} ${count} -> ${correctedSteps} steps`);
                        dataItem.steps = correctedSteps;
                    }
                }
            });
        });
    } else {
        console.log('  ✅ No duplicates detected');
    }
    
    console.log('\n❌ RESULT SHOWN IN DASHBOARD (incorrectly modified):');
    actualHealthKitData.forEach(item => {
        console.log(`  ${item.date}: ${item.steps.toLocaleString()} steps`);
    });
    
    return actualHealthKitData;
}

function showCorrectApproach() {
    console.log('\n' + '='.repeat(60));
    console.log('CORRECT APPROACH - PRESERVE REAL HEALTHKIT DATA');
    console.log('='.repeat(60));
    
    const realHealthKitData = [
        { date: '2025-06-03', steps: 7200 },
        { date: '2025-06-04', steps: 6800 },
        { date: '2025-06-05', steps: 8200 },
        { date: '2025-06-06', steps: 7500 },
        { date: '2025-06-07', steps: 8461 }, // User's actual data
        { date: '2025-06-08', steps: 6900 },
        { date: '2025-06-09', steps: 7800 },
    ];
    
    console.log('\n✅ HEALTHKIT DATA (should be preserved as-is):');
    realHealthKitData.forEach(item => {
        console.log(`  ${item.date}: ${item.steps.toLocaleString()} steps`);
    });
    
    console.log('\n🎯 SOLUTION:');
    console.log('  1. Remove artificial duplicate correction from useWeeklyMetrics');
    console.log('  2. Only apply duplicate detection for TRUE simulator issues');
    console.log('  3. Trust HealthKit data when it\'s real device data');
    console.log('  4. Use duplicate correction only as fallback for simulator');
    
    return realHealthKitData;
}

// Run simulations
const correctedData = simulateCurrentDataFlow();
const correctData = showCorrectApproach();

console.log('\n' + '='.repeat(60));
console.log('COMPARISON SUMMARY');
console.log('='.repeat(60));

console.log('\nUser expects (from iPhone Health app):');
console.log('  2025-06-07: 8,461 steps');

console.log('\nCurrent dashboard shows (incorrectly corrected):');
const june7Current = correctedData.find(item => item.date === '2025-06-07');
console.log(`  2025-06-07: ${june7Current ? june7Current.steps.toLocaleString() : 'N/A'} steps`);

console.log('\nShould show (preserve HealthKit data):');
const june7Correct = correctData.find(item => item.date === '2025-06-07');
console.log(`  2025-06-07: ${june7Correct ? june7Correct.steps.toLocaleString() : 'N/A'} steps`);

console.log('\n🔧 REQUIRED FIX:');
console.log('Remove duplicate correction logic from useWeeklyMetrics.ts');
console.log('Trust the actual HealthKit data from the device');

console.log('\n' + '='.repeat(60));
