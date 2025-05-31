# PHRApp - Personal Health Record Application

A React Native application for personal health record management with integration to HealthKit (iOS) and Google Fit (Android).

**注意**: このファイルは `docs/README.md` へのシンボリックリンクです。プロジェクトドキュメントは `docs` ディレクトリを参照してください。

## 開発ステータス

- **フェーズ1**: ✅ 完了 - コア認証＆データ同期
- **フェーズ2**: ✅ 完了 - 週次ダッシュボード＆小さな勝利バッジ
- **フェーズ3**: ✅ 完了 - パーミッションフロー改善＆ヘルスデータ統合
- **フェーズ4**: ✅ 完了 - AIチャット（GPT-4o）統合
- **フェーズ5**: ✅ 完了 - 品質向上＆リリース準備

詳細は [PROJECT_PHASES.md](./PROJECT_PHASES.md), [PHASE3_SUMMARY.md](./PHASE3_SUMMARY.md), 
[PHASE4_SUMMARY.md](./PHASE4_SUMMARY.md), [PHASE4_PLAN.md](./PHASE4_PLAN.md) と [PHASE5_COMPLETION.md](./PHASE5_COMPLETION.md) をご参照ください。

2025年5月30日に [プロジェクト構造の再編成](./PROJECT_REORGANIZATION.md) を完了し、より整理されたディレクトリ構造を採用しました。

## 機能

- 🔐 ユーザー認証と権限管理
- 📊 インタラクティブなチャートによる健康データ可視化
- 🏅 健康目標に対するバッジ達成システム
- 🤖 AIによるパーソナライズされた健康アドバイス（GPT-4o）
- 💬 自然言語による健康質問応答チャットインターフェース
- 📱 プラットフォーム固有のヘルスAPI連携（iOS/Android）
- 🔔 プッシュ通知システム
- 🎨 テーマカスタマイズ
- 🧪 エンドツーエンドテストサポート

## Tech Stack

- React Native + Expo
- Firebase Authentication & Firestore
- React Navigation
- HealthKit (iOS) & Google Fit (Android)
- Expo Notifications
- React Native Chart Kit
- Detox for E2E Testing

## Development

### Prerequisites

- Node.js (v18+)
- Xcode (for iOS)
- Android Studio (for Android)
- Expo CLI

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/phr-service.git
cd phr-service/PHRApp
```

2. Install dependencies:
```bash
npm install
```

3. iOS setup:
```bash
cd ios
pod install
cd ..
```

4. Start the development server:
```bash
npm run start
```

### Running on Device

- iOS:
```bash
npm run ios
```

- Android:
```bash
npm run android
```

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

#### iOS
```bash
npm run e2e:build:ios
npm run e2e:test:ios
```

#### Android
```bash
npm run e2e:build:android
npm run e2e:test:android
```

## CI/CD

This project uses GitHub Actions for continuous integration. The workflow includes:

- Linting
- Unit testing
- iOS and Android build verification

## Project Structure

- `/src/components` - Reusable UI components
- `/src/screens` - Application screens
- `/src/services` - API integrations and business logic
- `/src/hooks` - Custom React hooks
- `/src/context` - React context providers
- `/src/navigation` - Navigation configuration
- `/e2e` - End-to-end tests
