# OpenAI APIキー設定手順

PHRAppのAI機能を使用するには、OpenAI APIキーが必要です。このドキュメントでは、APIキーの取得方法と設定方法について説明します。

## 1. OpenAI APIキーの取得

1. [OpenAIのウェブサイト](https://platform.openai.com/)にアクセスし、アカウントを作成またはログインします。
2. ダッシュボードから「API Keys」セクションに移動します。
3. 「Create new secret key」ボタンをクリックして、新しいAPIキーを作成します。
4. キーに分かりやすい名前（例：「PHRApp AI Assistant」）を付けて作成します。
5. 表示されたAPIキー（「sk-」で始まる文字列）を安全な場所にコピーしておきます。**この文字列は一度しか表示されないので注意してください。**

## 2. Firebase Functionsにキーを設定する

### 2.1 Firebase CLIを使ってキーを設定 (Firebase Functions v2)

Firebase Functions v2 では、`functions:config:set` の代わりに `functions:secrets:set` を使用してAPIキーを設定します：

```bash
# プロジェクトディレクトリで以下のコマンドを実行
cd /Users/muroiyousuke/Projects/phr-service/PHRApp

# OpenAI APIキーをFirebase Functionsのシークレットとして設定
# このコマンドを実行すると、プロンプトでAPIキーの入力を求められます
firebase functions:secrets:set OPENAI_API_KEY

# 設定済みのシークレット一覧を確認（値は表示されません）
firebase functions:secrets:get

# Functionsを再デプロイ
firebase deploy --only functions
```

### 2.2 ローカル開発環境でのテスト

ローカル開発環境でFirebase Functionsをテストする場合は、`.env`ファイルを作成してAPIキーを設定します：

```bash
# functionsディレクトリに移動
cd /Users/muroiyousuke/Projects/phr-service/PHRApp/functions

# .envファイルを作成
echo "OPENAI_API_KEY=YOUR_OPENAI_API_KEY" > .env

# ローカルでFunctionsをテスト実行
npm run serve
```

これにより、ローカル開発時に `.env` ファイルから API キーが読み込まれるようになります。

## 3. セキュリティに関する注意事項

- APIキーは公開リポジトリにコミットしないでください。
- `.env`ファイルは`.gitignore`に含まれていることを確認してください。
- 本番環境では必ずFirebase Functionsのシークレットを使用してください。
- API キーが漏洩した場合は、すぐに OpenAI ダッシュボードで無効化し、新しいキーを生成してください。

## 4. トラブルシューティング

APIキー関連のエラーが発生した場合は、以下を確認してください：

- Firebase Functionsのシークレットが正しく設定されているか
  ```bash
  firebase functions:secrets:get
  ```
- キーが有効であるか（OpenAIダッシュボードで確認）
- 請求情報が正しく設定されているか（APIの使用には有効なクレジットカードが必要）

問題が解決しない場合は、Firebase Functionsのログを確認してください：

```bash
firebase functions:log
```

このログには、エラーメッセージや詳細情報が含まれています。
