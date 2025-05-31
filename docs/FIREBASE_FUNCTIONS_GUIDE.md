# Firebase Functions設定手順

PHRAppのAI機能は、Firebase Functionsを使って実装されています。このドキュメントでは、Functions環境の設定方法と、トラブルシューティングについて説明します。

## 前提条件

- Node.js 18がインストールされていること
- Firebase CLIがインストールされていること
  ```bash
  npm install -g firebase-tools
  ```
- Firebase CLIでログイン済みであること
  ```bash
  firebase login
  ```
- OpenAI APIキーを取得済みであること（`docs/SETUP_OPENAI_API_KEY.md`を参照）

## セットアップ手順

### 1. 環境変数の設定

Firebase Functionsで使用するOpenAI APIキーを設定します：

```bash
# プロジェクトディレクトリに移動
cd /Users/muroiyousuke/Projects/phr-service/PHRApp

# OpenAI APIキーを設定
firebase functions:config:set openai.api_key="YOUR_OPENAI_API_KEY"

# 設定を確認
firebase functions:config:get
```

### 2. 依存関係のインストール

```bash
# functionsディレクトリに移動
cd /Users/muroiyousuke/Projects/phr-service/PHRApp/functions

# 依存関係をインストール
npm install
```

### 3. ローカルでの開発とテスト

ローカルでFunctionsをテストする場合は、`.env`ファイルを作成してAPIキーを設定します：

```bash
# functionsディレクトリ内で
echo "OPENAI_API_KEY=YOUR_OPENAI_API_KEY" > .env

# ビルドとローカルエミュレータの起動
npm run build && firebase emulators:start --only functions
```

### 4. デプロイ

```bash
# functionsディレクトリ内で
npm run build && firebase deploy --only functions
```

## Functions一覧

PHRAppで使用しているFunctionsは以下の通りです：

1. `generateAIChatResponse` - ユーザーのチャットメッセージに対するAI応答を生成
2. `getUserConversationHistory` - ユーザーの会話履歴を取得
3. `checkDailySteps` - 毎日の歩数チェックと通知送信（定期実行）

## よくあるエラーとトラブルシューティング

### OpenAI API関連のエラー

- エラー: `OpenAI API key is not configured`
  - 解決策: Firebase Functionsの環境変数にOpenAI APIキーが正しく設定されているか確認してください
  ```bash
  firebase functions:config:get
  ```

### Firebase Functions関連のエラー

- エラー: `The default Firebase app does not exist.`
  - 解決策: Functionsのコードで`admin.initializeApp()`が複数回呼び出されていないか確認してください

- エラー: `PERMISSION_DENIED: Missing or insufficient permissions`
  - 解決策: Firestoreのセキュリティルールを確認し、必要なコレクションへのアクセス権限が付与されているか確認してください

### デプロイエラー

- エラー: `functions predeploy error: Command terminated with non-zero exit code`
  - 解決策: ESLintエラーを修正するか、一時的に無効化してデプロイしてください
  ```bash
  cd functions && npm run lint -- --fix
  ```

## ログの確認

デプロイ済みのFunctionsのログを確認するには：

```bash
firebase functions:log
```

## リージョン設定

PHRAppのFunctionsは`asia-northeast1`（東京）リージョンにデプロイされています。クライアントコードでFunctionsを呼び出す際は、このリージョンを指定する必要があります：

```javascript
const functions = getFunctions(getApp(), 'asia-northeast1');
```
