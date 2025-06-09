#!/usr/bin/env node

/**
 * Debug script to investigate duplicate step data issue
 * This script simulates the useWeeklyMetrics query to identify the root cause
 */

console.log('🔍 歴史的ステップデータ重複問題のデバッグ開始...\n');

// Mock data to simulate what might be in Firestore
const mockFirestoreData = [
  // Today's data (correct)
  { id: 'doc1', date: '2024-12-21', steps: 8542, source: 'healthkit', userId: 'test-user' },
  
  // Yesterday's data (correct)
  { id: 'doc2', date: '2024-12-20', steps: 7231, source: 'healthkit', userId: 'test-user' },
  
  // Day before yesterday - might be duplicated
  { id: 'doc3', date: '2024-12-19', steps: 7231, source: 'healthkit', userId: 'test-user' },
  
  // Older days with potentially duplicated data
  { id: 'doc4', date: '2024-12-18', steps: 7231, source: 'healthkit', userId: 'test-user' },
  { id: 'doc5', date: '2024-12-17', steps: 7231, source: 'healthkit', userId: 'test-user' },
  { id: 'doc6', date: '2024-12-16', steps: 7231, source: 'healthkit', userId: 'test-user' },
  { id: 'doc7', date: '2024-12-15', steps: 7231, source: 'healthkit', userId: 'test-user' },
];

// Simulate useWeeklyMetrics logic
function simulateUseWeeklyMetrics() {
  console.log('📊 useWeeklyMetrics シミュレーション開始...');
  
  // Calculate date range (last 7 days)
  const today = new Date('2024-12-21'); // Mock today
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const startStr = start.toISOString().split('T')[0];
  
  console.log(`📅 取得対象期間: ${startStr} から今日まで`);
  
  // Filter documents by date range (simulate Firestore query)
  const filteredDocs = mockFirestoreData.filter(doc => 
    doc.date >= startStr
  );
  
  console.log(`📄 Firestoreから取得されたドキュメント (${filteredDocs.length}件):`);
  filteredDocs.forEach(doc => {
    console.log(`  - ${doc.date}: ${doc.steps}歩 (${doc.source})`);
  });
  
  // Convert to expected format
  const raw = filteredDocs.map(doc => ({
    date: doc.date,
    steps: doc.steps
  }));
  
  // Generate expected dates array
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  
  console.log(`\n📅 期待される日付配列:`, dates);
  
  // Create lookup map
  const lookup = raw.reduce((m, rec) => ({ ...m, [rec.date]: rec.steps }), {});
  console.log(`\n🗂️ ルックアップマップ:`, lookup);
  
  // Fill missing dates with 0
  const filled = dates.map(date => ({ 
    date, 
    steps: lookup[date] ?? 0 
  }));
  
  console.log(`\n📊 最終的なグラフデータ:`);
  filled.forEach((item, index) => {
    const dayName = ['日', '月', '火', '水', '木', '金', '土'][new Date(item.date).getDay()];
    console.log(`  ${index + 1}. ${item.date} (${dayName}): ${item.steps}歩`);
  });
  
  return filled;
}

// Analyze for duplicate patterns
function analyzeDuplicatePattern(data) {
  console.log('\n🔍 重複パターン分析...');
  
  const stepCounts = {};
  data.forEach(item => {
    if (item.steps > 0) {
      if (!stepCounts[item.steps]) {
        stepCounts[item.steps] = [];
      }
      stepCounts[item.steps].push(item.date);
    }
  });
  
  console.log('\n📈 歩数別グループ化:');
  Object.entries(stepCounts).forEach(([steps, dates]) => {
    console.log(`  ${steps}歩: ${dates.join(', ')}`);
    if (dates.length > 1) {
      console.log(`    ⚠️  ${dates.length}日間で同じ歩数が検出されました！`);
    }
  });
  
  // Check for consecutive duplicates
  console.log('\n🔄 連続重複チェック:');
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    
    if (current.steps === previous.steps && current.steps > 0) {
      console.log(`  ⚠️  ${previous.date} → ${current.date}: 同じ歩数 (${current.steps}歩)`);
    }
  }
}

// Potential causes analysis
function analyzePotentialCauses() {
  console.log('\n🔬 潜在的な原因分析...');
  
  console.log('\n1. データ同期の問題:');
  console.log('   - HealthKitから同じデータが複数日に対して取得されている');
  console.log('   - 日付フィルタリングに問題がある可能性');
  
  console.log('\n2. Firestoreへの保存の問題:');
  console.log('   - 同じドキュメントが複数の日付で保存されている');
  console.log('   - タイムゾーンの問題で日付がずれている');
  
  console.log('\n3. データ取得の問題:');
  console.log('   - useWeeklyMetricsのクエリロジックに問題がある');
  console.log('   - 日付範囲の計算に誤りがある');
  
  console.log('\n4. HealthKitの問題:');
  console.log('   - iOS HealthKitから過去のデータが正しく取得できていない');
  console.log('   - データが存在しない日に前日のデータが返されている');
}

// Recommended fixes
function recommendFixes() {
  console.log('\n🛠️  推奨する修正方法...');
  
  console.log('\n1. Firestoreクエリの詳細ログを追加:');
  console.log('   - useWeeklyMetricsでクエリ結果を詳細にログ出力');
  console.log('   - 各ドキュメントの内容を確認');
  
  console.log('\n2. HealthKitデータ取得の詳細ログを追加:');
  console.log('   - stepsDataSyncServiceでHealthKitから取得した生データをログ出力');
  console.log('   - 日付ごとの歩数データを確認');
  
  console.log('\n3. 日付処理ロジックの検証:');
  console.log('   - タイムゾーン処理の統一');
  console.log('   - 日付文字列フォーマットの統一');
  
  console.log('\n4. データ重複の除去:');
  console.log('   - 同じ日付で複数のレコードがある場合の処理');
  console.log('   - 最新データを優先するロジックの追加');
}

// Run analysis
const result = simulateUseWeeklyMetrics();
analyzeDuplicatePattern(result);
analyzePotentialCauses();
recommendFixes();

console.log('\n✅ デバッグ分析完了');
