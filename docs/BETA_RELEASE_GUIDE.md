# PHRApp ベータ版リリース手順書

## 📋 事前準備

### 1. 開発環境の確認
```bash
# Node.js, npm, Expo CLI の確認
node --version  # v18.0.0 以上
npm --version   # v8.0.0 以上
npx expo --version  # v5.0.0 以上

# EAS CLI のインストール
npm install -g @expo/eas-cli
eas login
```

### 2. プロジェクト設定の確認
```bash
cd /path/to/PHRApp
npm install
npm audit fix  # セキュリティ脆弱性の修正
```

### 3. 環境変数の設定
```bash
# .env.local ファイルに以下を設定
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
```

## 🍎 iOS ベータ版リリース (TestFlight)

### Step 1: App Store Connect の設定
1. [App Store Connect](https://appstoreconnect.apple.com) にログイン
2. 「アプリ」→「新しいアプリ」をクリック
3. アプリ情報を入力:
   - **アプリ名**: PHR Health Tracker
   - **主要言語**: 日本語
   - **バンドルID**: com.yourcompany.phrapp
   - **SKU**: PHR_APP_001

### Step 2: EAS Build 設定
```bash
# プロジェクトを EAS に設定
eas build:configure

# iOS ビルドの実行
eas build --platform ios --profile preview
```

### Step 3: TestFlight アップロード
```bash
# ビルド完了後、自動でTestFlightにアップロード
# または手動アップロード
eas submit --platform ios
```

### Step 4: 内部テスターの招待
1. App Store Connect → TestFlight
2. 「内部テスト」→「テスター追加」
3. メールアドレスで招待送信

## 🤖 Android ベータ版リリース (Google Play Console)

### Step 1: Google Play Console の設定
1. [Google Play Console](https://play.google.com/console) にログイン
2. 「アプリを作成」をクリック
3. アプリ情報を入力:
   - **アプリ名**: PHR Health Tracker
   - **デフォルト言語**: 日本語
   - **アプリの種類**: アプリ
   - **無料・有料**: 無料

### Step 2: EAS Build でAndroidビルド
```bash
# Android ビルドの実行
eas build --platform android --profile preview
```

### Step 3: Play Console アップロード
```bash
# ビルド完了後、Play Console にアップロード
eas submit --platform android
```

### Step 4: 内部テスト設定
1. Play Console → テスト → 内部テスト
2. 「新しいリリースを作成」
3. テスターリストを作成・招待

## 🔍 品質チェックリスト

### ビルド前チェック
- [ ] TypeScript エラーなし (`npx tsc --noEmit`)
- [ ] ESLint 警告の確認 (`npx eslint src/`)
- [ ] テスト実行 (`npm test`)
- [ ] アプリ動作確認 (`expo start`)

### ビルド後チェック
- [ ] アプリサイズの確認 (iOS: <100MB, Android: <150MB)
- [ ] 起動時間の測定 (<3秒)
- [ ] メモリ使用量の確認
- [ ] クラッシュレポートの確認

### 機能テスト
- [ ] ユーザー登録・ログイン
- [ ] 音声認識機能
- [ ] チャット機能
- [ ] デイリーボーナス
- [ ] 設定変更・保存
- [ ] データ同期

## 📱 テスター招待とフィードバック収集

### テスター招待メールテンプレート

**件名**: PHRApp ベータテスト参加のご案内

```
お疲れ様です。

PHRApp（Personal Health Record アプリ）のベータテストにご参加いただき、
ありがとうございます。

【アプリ概要】
- 健康管理・記録アプリ
- 音声認識によるチャット機能
- ゲーミフィケーション要素
- 日本語対応

【テスト期間】
2024年6月1日 〜 2024年6月30日

【iOS版のインストール】
1. TestFlightアプリをApp Storeからダウンロード
2. 招待メールのリンクをタップ
3. TestFlightでPHRAppをインストール

【Android版のインストール】
1. 招待メールのリンクをタップ
2. Google Playでベータ版を受け入れ
3. アプリをインストール

【フィードバック方法】
- バグレポート: [バグ報告フォーム]
- 機能要望: [要望フォーム]
- 緊急連絡: beta-support@yourcompany.com

よろしくお願いいたします。
```

### フィードバック収集フォーム設定
1. Google Forms または Typeform でアンケート作成
2. 以下の項目を含める:
   - 使用デバイス・OS
   - 発生した問題・バグ
   - 使いやすさの評価
   - 機能要望
   - 総合評価

## 📊 分析・モニタリング設定

### Firebase Analytics 設定
```javascript
// Analytics イベントの設定例
import { logEvent } from 'firebase/analytics';

// ベータテスト特有のイベント
logEvent(analytics, 'beta_app_launch', {
  version: '1.0.0-beta',
  platform: Platform.OS
});

logEvent(analytics, 'beta_feature_usage', {
  feature_name: 'voice_recognition',
  user_type: 'beta_tester'
});
```

### クラッシュ監視
```bash
# Crashlytics の有効化（プロダクション版）
# 現在はコンソールログのみ
```

## 🚨 緊急対応手順

### クリティカルバグ発見時
1. **即座に対応**: 重大なバグを発見した場合
2. **ホットフィックス**: 緊急修正版をビルド
3. **緊急更新**: TestFlight/Play Console で即座にアップデート
4. **テスター連絡**: 緊急更新の通知

### 緊急連絡先
- 開発チーム: dev-team@yourcompany.com
- プロダクトマネージャー: pm@yourcompany.com
- QAチーム: qa@yourcompany.com

## 📈 成功指標

### 技術指標
- **クラッシュ率**: <1%
- **起動時間**: <3秒
- **ANR（Android Not Responding）**: <0.5%
- **メモリリーク**: なし

### ユーザー指標
- **インストール率**: >80%（招待者に対して）
- **7日継続率**: >50%
- **フィードバック回答率**: >30%
- **満足度**: 4.0/5.0以上

## ✅ リリース完了後のアクション

### 1週間後
- [ ] 使用状況レポート作成
- [ ] バグレポート集計・分析
- [ ] ユーザーフィードバック分析
- [ ] パフォーマンスメトリクス確認

### 2週間後
- [ ] 中間レビュー実施
- [ ] 優先修正項目の決定
- [ ] 次回アップデート計画策定

### 1ヶ月後
- [ ] ベータテスト結果の総合評価
- [ ] プロダクション版リリース判定
- [ ] 正式リリース計画策定

---

**重要**: このドキュメントは随時更新してください。新しい問題や改善点が発見され次第、手順を更新することが重要です。
