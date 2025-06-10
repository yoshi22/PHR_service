#!/usr/bin/env node

/**
 * HealthKit Data Diagnosis Script
 * ヘルスケアアプリとダッシュボードの歩数データの違いを詳細に診断します
 */

console.log('🔍 HealthKit Data Diagnosis - Starting...\n');

// 問題の可能性を整理
const possibleIssues = [
  {
    issue: 'HealthKit API の日付範囲指定エラー',
    description: 'startDate/endDate の時間帯設定が間違っている',
    investigation: 'Check stepsDataSyncService.ts line 78-85'
  },
  {
    issue: 'HealthKit 権限設定の問題',
    description: 'HealthKit の読み取り権限が正しく設定されていない',
    investigation: 'Check healthService.ts permissions'
  },
  {
    issue: 'データ取得方法の問題',
    description: 'getDailyStepCountSamples vs getStepCount の使い分け',
    investigation: 'Cross-validation between multiple HealthKit APIs'
  },
  {
    issue: 'Firestore 保存・読み取りエラー',
    description: 'HealthKit から取得したデータが Firestore に正しく保存されていない',
    investigation: 'Check syncStepsData function and Firestore documents'
  },
  {
    issue: 'タイムゾーンの問題',
    description: '日本時間とUTCの変換でデータがずれている',
    investigation: 'Check date handling in all services'
  },
  {
    issue: 'データ重複・上書きの問題',
    description: '古いデータが新しいデータを上書きしている',
    investigation: 'Check duplicate detection and merge logic'
  }
];

console.log('📋 Potential Issues Analysis:');
possibleIssues.forEach((item, index) => {
  console.log(`${index + 1}. ${item.issue}`);
  console.log(`   Description: ${item.description}`);
  console.log(`   Investigation: ${item.investigation}`);
  console.log('');
});

console.log('🔧 Recommended Investigation Steps:');
console.log('1. Check current HealthKit permissions');
console.log('2. Test HealthKit API calls with exact date ranges');
console.log('3. Compare raw HealthKit data vs Firestore stored data');
console.log('4. Verify timezone handling');
console.log('5. Check for data duplication patterns');
console.log('');

console.log('🧪 Next Steps:');
console.log('1. Create a diagnostic component to test HealthKit APIs directly');
console.log('2. Add detailed logging to track data flow');
console.log('3. Implement data validation and correction');
console.log('');

const debugQuestions = [
  'ヘルスケアアプリで今日と昨日の歩数は何歩ですか？',
  'ダッシュボードで表示されている今日と昨日の歩数は何歩ですか？',
  'HealthKit の読み取り権限は正しく許可されていますか？',
  'アプリを再起動した後も同じ問題が発生しますか？',
  '他の日付の歩数データは正確ですか？'
];

console.log('❓ Debug Questions for User:');
debugQuestions.forEach((question, index) => {
  console.log(`${index + 1}. ${question}`);
});

console.log('\n✅ Diagnosis script completed. Please run the manual tests next.');
