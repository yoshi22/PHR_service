# AI機能デプロイガイド

PHRAppのAI機能（OpenAI API連携）のデプロイ方法について詳しく説明します。

## 1. システム構成

PHRAppのAI機能は以下のコンポーネントで構成されています：

- **クライアント側**: `/src/services/aiService.ts`
  - Firebase Functionsを呼び出してOpenAI APIと連携
  - 東京リージョン（asia-northeast1）を使用

- **サーバー側**: `/functions/src/ai-functions.ts`
  - Firebase Functions v2
  - OpenAI APIを使用してチャット応答を生成
  - ユーザーの会話履歴をFirestoreに保存

## 2. 前提条件

- Firebase CLIがインストールされていること
- プロジェクトがFirebaseに接続されていること
- OpenAI APIキーを取得していること（[OpenAI API](https://platform.openai.com/)）

## 3. Firebase Functions v2 による設定

### 3.1 OpenAI APIキーの設定

Firebase Functions v2では、環境変数ではなく「Secret」としてAPIキーを管理します：

```bash
# Firebase Secretとして OpenAI APIキーを設定
firebase functions:secrets:set OPENAI_API_KEY

# プロンプトでAPIキーを入力（非表示モードで入力されます）
```

### 3.2 Functionsのビルドとデプロイ

```bash
# functionsディレクトリに移動
cd functions

# 必要なパッケージをインストール
npm install

# TypeScriptをコンパイル
npm run build

# デプロイ
firebase deploy --only functions
```

## 4. デプロイ後の確認

1. Firebase Consoleにアクセス: https://console.firebase.google.com/
2. プロジェクトを選択
3. "Functions"メニューから、デプロイされた関数が動作していることを確認:
   - `generateAIChatResponse`
   - `getUserConversationHistory`
4. Functionsログを確認：
   ```bash
   firebase functions:log
   ```

## 5. クライアントアプリでのテスト

1. アプリを再起動
2. AIチャット画面に移動
3. 質問を入力して送信
4. AI応答が返ってくることを確認

## 6. トラブルシューティング

### 6.1 一般的なエラー

#### エラー: "OpenAI API key is not configured"

```
Firebase Functions: API key is not configured. Please set it using 'firebase functions:secrets:set OPENAI_API_KEY=YOUR_KEY'
```

**解決策**: 
- APIキーがSecretとして正しく設定されているか確認
- Functionsを再デプロイ

#### エラー: "AIレスポンスの生成中にエラーが発生しました"

**解決策**:
1. Firebase Functions ログを確認
2. OpenAI API キーの有効性を確認
3. OpenAI ダッシュボードで請求情報（Billing）の設定を確認

### 6.2 リージョン関連の問題

クライアント側とサーバー側で同じリージョンを指定しているか確認：

クライアント側：
```typescript
const functions = getFunctions(getApp(), 'asia-northeast1'); // 東京リージョン
```

サーバー側：
```typescript
export const generateAIChatResponse = onCall({ 
  region: "asia-northeast1", // 東京リージョン
  // ...
```

## 7. プロダクション環境での考慮事項

- API使用量を監視し、コストを管理
- エラーハンドリングを強化
- レスポンス内容のフィルタリング/モデレーションの検討
- OpenAI API キーを定期的に更新
