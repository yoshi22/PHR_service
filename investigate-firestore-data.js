#!/usr/bin/env node

/**
 * Firestore Data Investigation Script
 * This script will help investigate the actual data stored in Firestore
 * to identify the root cause of duplicate step values
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'users.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.log('❌ Service account file not found. Creating mock investigation...');
  runMockInvestigation();
} else {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://phr-service-default-rtdb.firebaseio.com"
  });
  
  const db = admin.firestore();
  runFirestoreInvestigation(db);
}

async function runFirestoreInvestigation(db) {
  console.log('🔍 Firestore データ調査開始...\n');
  
  try {
    // Get all userSteps documents
    const userStepsRef = db.collection('userSteps');
    const snapshot = await userStepsRef.orderBy('date', 'desc').limit(20).get();
    
    console.log(`📊 最新の20件のuserStepsドキュメント:`);
    
    const documents = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        ...data
      });
      console.log(`  ${doc.id}: ${data.date} - ${data.steps}歩 (${data.source || 'unknown'}) - ${data.userId}`);
    });
    
    // Analyze for patterns
    analyzeDuplicatePatterns(documents);
    
  } catch (error) {
    console.error('❌ Firestore調査エラー:', error);
    console.log('🔄 モック調査を実行します...');
    runMockInvestigation();
  }
}

function runMockInvestigation() {
  console.log('🔍 モックデータでの調査開始...\n');
  
  // Simulate the duplicate data pattern we're seeing
  const mockDocuments = [
    { id: 'user1_2024-12-21', date: '2024-12-21', steps: 8542, source: 'healthkit', userId: 'user1' },
    { id: 'user1_2024-12-20', date: '2024-12-20', steps: 7231, source: 'healthkit', userId: 'user1' },
    { id: 'user1_2024-12-19', date: '2024-12-19', steps: 7231, source: 'healthkit', userId: 'user1' }, // Duplicate
    { id: 'user1_2024-12-18', date: '2024-12-18', steps: 7231, source: 'healthkit', userId: 'user1' }, // Duplicate
    { id: 'user1_2024-12-17', date: '2024-12-17', steps: 7231, source: 'healthkit', userId: 'user1' }, // Duplicate
    { id: 'user1_2024-12-16', date: '2024-12-16', steps: 7231, source: 'healthkit', userId: 'user1' }, // Duplicate
    { id: 'user1_2024-12-15', date: '2024-12-15', steps: 7231, source: 'healthkit', userId: 'user1' }, // Duplicate
  ];
  
  console.log('📊 モックFirestoreデータ:');
  mockDocuments.forEach(doc => {
    console.log(`  ${doc.id}: ${doc.date} - ${doc.steps}歩 (${doc.source}) - ${doc.userId}`);
  });
  
  analyzeDuplicatePatterns(mockDocuments);
}

function analyzeDuplicatePatterns(documents) {
  console.log('\n🔍 重複パターン分析...');
  
  // Group by user first
  const userGroups = {};
  documents.forEach(doc => {
    if (!userGroups[doc.userId]) {
      userGroups[doc.userId] = [];
    }
    userGroups[doc.userId].push(doc);
  });
  
  Object.entries(userGroups).forEach(([userId, userDocs]) => {
    console.log(`\n👤 ユーザー: ${userId}`);
    
    // Sort by date
    userDocs.sort((a, b) => a.date.localeCompare(b.date));
    
    // Check for step duplicates
    const stepCounts = {};
    userDocs.forEach(doc => {
      if (doc.steps > 0) {
        if (!stepCounts[doc.steps]) {
          stepCounts[doc.steps] = [];
        }
        stepCounts[doc.steps].push(doc.date);
      }
    });
    
    console.log('📈 歩数別グループ化:');
    Object.entries(stepCounts).forEach(([steps, dates]) => {
      console.log(`  ${steps}歩: ${dates.join(', ')}`);
      if (dates.length > 1) {
        console.log(`    ⚠️  ${dates.length}日間で同じ歩数が検出されました！`);
      }
    });
    
    // Check for consecutive duplicates
    console.log('\n🔄 連続重複チェック:');
    for (let i = 1; i < userDocs.length; i++) {
      const current = userDocs[i];
      const previous = userDocs[i - 1];
      
      if (current.steps === previous.steps && current.steps > 0) {
        console.log(`  ⚠️  ${previous.date} → ${current.date}: 同じ歩数 (${current.steps}歩)`);
      }
    }
    
    // Analyze timestamps if available
    console.log('\n⏰ タイムスタンプ分析:');
    userDocs.forEach(doc => {
      if (doc.updatedAt || doc.syncedAt) {
        const timestamp = doc.updatedAt?.toDate?.() || new Date(doc.syncedAt || doc.updatedAt);
        console.log(`  ${doc.date}: 更新日時 ${timestamp}`);
      }
    });
  });
  
  console.log('\n🔬 潜在的な原因:');
  console.log('1. HealthKitが過去の日付に対して同じデータを返している');
  console.log('2. 日付計算のロジックにタイムゾーンの問題がある');
  console.log('3. Firestoreへの保存時に日付が正しく設定されていない');
  console.log('4. データ同期プロセスが過去のデータを上書きしている');
  
  console.log('\n🛠️  推奨する調査手順:');
  console.log('1. HealthKitから実際に取得される生データをログ出力');
  console.log('2. 各日付に対するHealthKitクエリの詳細ログ');
  console.log('3. Firestoreに保存される直前のデータをログ出力');
  console.log('4. useWeeklyMetricsで取得されるFirestoreデータをログ出力');
}

console.log('✅ データ調査完了');
