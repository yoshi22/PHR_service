/**
 * テスト用のHealthKitデータ生成関数
 * 実際のHealthKitが返すであろうデータパターンをシミュレートして問題を特定
 */

// 現在の日付（2024-12-21を想定）
const currentDate = new Date('2024-12-21');

// HealthKitが返すであろう過去7日間のデータパターンをシミュレート
function simulateHealthKitData() {
  console.log('🏥 HealthKit データシミュレーション開始...\n');
  
  // パターン1: 正常なケース（各日に異なる歩数）
  const normalPattern = generateNormalStepsData();
  console.log('📊 正常パターン（期待される動作）:');
  normalPattern.forEach(item => {
    console.log(`  ${item.date}: ${item.steps}歩`);
  });
  
  // パターン2: 重複データパターン（問題のあるケース）
  const duplicatePattern = generateDuplicateStepsData();
  console.log('\n📊 重複パターン（現在の問題）:');
  duplicatePattern.forEach(item => {
    console.log(`  ${item.date}: ${item.steps}歩`);
  });
  
  // パターン3: HealthKitが古いデータを返すケース
  const staleDataPattern = generateStaleDataPattern();
  console.log('\n📊 古いデータパターン（HealthKitの問題）:');
  staleDataPattern.forEach(item => {
    console.log(`  ${item.date}: ${item.steps}歩`);
  });
  
  return { normalPattern, duplicatePattern, staleDataPattern };
}

function generateNormalStepsData() {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // 各日に異なる現実的な歩数
    const steps = 6000 + Math.floor(Math.random() * 4000) + (i * 200);
    data.push({ date: dateStr, steps });
  }
  return data;
}

function generateDuplicateStepsData() {
  const data = [];
  const yesterdaySteps = 7231; // 昨日の歩数
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    let steps;
    if (i === 0) {
      // 今日は正しい歩数
      steps = 8542;
    } else if (i === 1) {
      // 昨日は正しい歩数
      steps = yesterdaySteps;
    } else {
      // それ以前の日はすべて昨日と同じ歩数（問題のパターン）
      steps = yesterdaySteps;
    }
    
    data.push({ date: dateStr, steps });
  }
  return data;
}

function generateStaleDataPattern() {
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    let steps;
    if (i <= 1) {
      // 今日と昨日は正しいデータ
      steps = i === 0 ? 8542 : 7231;
    } else {
      // 古い日付に対してHealthKitがデータを返さない、または0を返す
      steps = 0;
    }
    
    data.push({ date: dateStr, steps });
  }
  return data;
}

// useWeeklyMetricsの処理をシミュレート
function simulateUseWeeklyMetricsProcessing(healthKitData) {
  console.log('\n🔄 useWeeklyMetrics処理シミュレーション...');
  
  // Firestoreに保存されているであろうデータ（HealthKitデータがそのまま保存されたと仮定）
  const firestoreData = healthKitData.map(item => ({
    id: `user1_${item.date}`,
    date: item.date,
    steps: item.steps,
    source: 'healthkit',
    userId: 'user1'
  }));
  
  console.log('\n💾 Firestoreに保存されたデータ:');
  firestoreData.forEach(doc => {
    console.log(`  ${doc.id}: ${doc.date} - ${doc.steps}歩`);
  });
  
  // useWeeklyMetricsでの日付範囲計算
  const today = new Date(currentDate);
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const startStr = start.toISOString().split('T')[0];
  
  console.log(`\n📅 useWeeklyMetrics 日付範囲: ${startStr} 〜 ${today.toISOString().split('T')[0]}`);
  
  // Firestoreクエリのシミュレート（日付でフィルタ）
  const filteredData = firestoreData.filter(doc => doc.date >= startStr);
  
  console.log('\n🔍 Firestoreクエリ結果:');
  filteredData.forEach(doc => {
    console.log(`  ${doc.date}: ${doc.steps}歩`);
  });
  
  // 期待される7日間の日付配列を生成
  const expectedDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    expectedDates.push(d.toISOString().split('T')[0]);
  }
  
  console.log('\n📋 期待される日付配列:', expectedDates);
  
  // データをルックアップマップに変換
  const lookup = filteredData.reduce((m, doc) => ({ ...m, [doc.date]: doc.steps }), {});
  console.log('\n🗂️ ルックアップマップ:', lookup);
  
  // 最終的なグラフデータ（欠損日は0で埋める）
  const finalData = expectedDates.map(date => ({
    date,
    steps: lookup[date] ?? 0
  }));
  
  console.log('\n📊 最終的なグラフデータ:');
  finalData.forEach((item, index) => {
    const dayName = ['日', '月', '火', '水', '木', '金', '土'][new Date(item.date).getDay()];
    console.log(`  ${index + 1}. ${item.date} (${dayName}): ${item.steps}歩`);
  });
  
  return finalData;
}

// 問題の分析
function analyzeProblems() {
  console.log('\n🔬 問題分析...\n');
  
  const patterns = simulateHealthKitData();
  
  console.log('='.repeat(50));
  console.log('🧪 正常パターンの場合:');
  console.log('='.repeat(50));
  simulateUseWeeklyMetricsProcessing(patterns.normalPattern);
  
  console.log('\n' + '='.repeat(50));
  console.log('⚠️  重複パターンの場合（現在の問題）:');
  console.log('='.repeat(50));
  simulateUseWeeklyMetricsProcessing(patterns.duplicatePattern);
  
  console.log('\n' + '='.repeat(50));
  console.log('🔄 古いデータパターンの場合:');
  console.log('='.repeat(50));
  simulateUseWeeklyMetricsProcessing(patterns.staleDataPattern);
  
  console.log('\n🎯 結論:');
  console.log('現在の問題は、HealthKitが過去の日付に対して');
  console.log('昨日と同じ歩数データを返している可能性が高い。');
  console.log('これは以下の原因が考えられる：');
  console.log('1. HealthKitに実際のデータが存在しない');
  console.log('2. HealthKitクエリの日付範囲に問題がある');
  console.log('3. iOSシミュレーターの制限でHealthKitデータが不完全');
}

// 解決策の提案
function proposeSolutions() {
  console.log('\n💡 解決策の提案:\n');
  
  console.log('1. HealthKitデータの詳細ログ出力');
  console.log('   - HealthKit API から返される生データをすべてログ出力');
  console.log('   - 各日付に対するクエリ結果を個別に確認');
  
  console.log('\n2. 日付範囲クエリの改善');
  console.log('   - 各日付に対して個別のクエリを実行');
  console.log('   - タイムゾーンの問題を避けるため、UTC統一処理');
  
  console.log('\n3. データ検証とフォールバック');
  console.log('   - 同じ歩数が連続する場合の検出と修正');
  console.log('   - 実際のHealthKitデータが不足している場合の適切な処理');
  
  console.log('\n4. シミュレーター対応');
  console.log('   - iOSシミュレーターでは実際のHealthKitデータが存在しない');
  console.log('   - テスト用のモックデータ生成機能の改善');
}

// 実行
console.log('🏥📊 HealthKit歩数データ重複問題の詳細分析\n');
analyzeProblems();
proposeSolutions();
console.log('\n✅ 分析完了');
