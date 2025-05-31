# Firebase Functions デプロイ手順

以下の手順で Firebase Functions をデプロイします。

## 1. OpenAI API キーの設定

Firebase Functions v2 では、環境変数の代わりに Secrets を使用します。
以下のコマンドで OpenAI API キーを設定します：

```bash
# プロジェクトのルートディレクトリで実行
cd /Users/muroiyousuke/Projects/phr-service/PHRApp

# OpenAI APIキーを Firebase Secret として設定
# このコマンドを実行すると、プロンプトでAPIキーの入力を求められます
firebase functions:secrets:set OPENAI_API_KEY

# 設定されたSecretsを確認（一覧のみ表示、値は表示されません）
firebase functions:secrets:get
```

## 2. Firestore セキュリティルールのデプロイ

```bash
# プロジェクトのルートディレクトリで実行
cd /Users/muroiyousuke/Projects/phr-service/PHRApp
firebase deploy --only firestore:rules
```

## 3. Firebase Functions のビルドとデプロイ

```bash
# functionsディレクトリに移動してからビルドとデプロイを実行
cd /Users/muroiyousuke/Projects/phr-service/PHRApp/functions
npm run build
firebase deploy --only functions
```

## トラブルシューティング

### デプロイエラー

デプロイ中にESLintエラーが発生した場合は、以下のコマンドで自動修正を試みることができます：

```bash
cd /Users/muroiyousuke/Projects/phr-service/PHRApp/functions
npm run lint -- --fix
```

それでも解決しない場合は、一時的にESLintチェックをスキップしてデプロイすることもできます：

```bash
cd /Users/muroiyousuke/Projects/phr-service/PHRApp/functions
npm run build
ESLINT_NO_DEV_ERRORS=true firebase deploy --only functions
```

### OpenAI API キーエラー

OpenAI API キー関連のエラーが発生した場合は、以下を確認してください：

1. Secret が正しく設定されているか確認：
```bash
firebase functions:secrets:get
```

2. Secret を再設定（必要な場合）：
```bash
firebase functions:secrets:set OPENAI_API_KEY
```

3. Functions を再デプロイ：
```bash
cd /Users/muroiyousuke/Projects/phr-service/PHRApp/functions
npm run build
firebase deploy --only functions
```

## デプロイ後の確認

デプロイが成功したら、以下のコマンドでFunctionsのログを確認できます：

```bash
firebase functions:log
```
