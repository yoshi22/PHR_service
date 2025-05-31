# OpenAI API クォータの設定

PHRAppのAI機能を使用するには、適切なOpenAI APIのクォータ（使用量制限）が必要です。このドキュメントでは、APIクォータの確認方法と設定方法について説明します。

## 1. エラーについて

現在発生しているエラー：
```
RateLimitError: 429 You exceeded your current quota, please check your plan and billing details. 
For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.
```

このエラーは、OpenAI APIの使用量制限（クォータ）を超えたことを示しています。

## 2. 問題の解決方法

### 2.1 OpenAIダッシュボードで請求情報を確認

1. [OpenAIのダッシュボード](https://platform.openai.com/account/billing/overview)にアクセスします。
2. サイドバーから「Billing」（請求）セクションに移動します。
3. 以下を確認してください：
   - 有効なクレジットカードが登録されているか
   - 無料枠（free tier）を使い切っていないか
   - 請求の支払いが滞っていないか

### 2.2 APIキーの使用状況を確認

1. [APIキーの使用状況ページ](https://platform.openai.com/account/usage)にアクセスします。
2. 現在の使用量とクォータを確認します。
3. 使用量が上限に達している場合は、以下の対策を検討してください：

### 2.3 対策

以下のいずれかの方法でクォータの問題を解決できます：

#### 支払い方法の追加または更新

1. [Billing（請求）ページ](https://platform.openai.com/account/billing/payment-methods)に移動します。
2. 有効なクレジットカードを追加または更新します。
3. 支払い方法が有効化されると、すぐにAPI使用量の制限が緩和されます。

#### 支出上限の設定

1. [Usage limits（使用制限）ページ](https://platform.openai.com/account/billing/limits)に移動します。
2. 適切な月間支出上限を設定します。
   - デフォルトでは$120/月に設定されている場合があります
   - アプリケーションの予想使用量に基づいて調整してください

#### 新しいAPIキーの作成

既存のAPIキーが何らかの理由でブロックされている場合は、新しいキーを作成することも検討してください：

1. [API Keysページ](https://platform.openai.com/api-keys)に移動します。
2. 「Create new secret key」をクリックします。
3. 新しいキーを作成し、Firebase Functionsのシークレットとして設定します：
   ```bash
   firebase functions:secrets:set OPENAI_API_KEY
   ```
4. プロンプトで新しいAPIキーを入力します。

## 3. テスト

クォータの問題を解決したら、以下の手順でアプリケーションをテストします：

1. アプリを再起動
2. AIチャット機能にアクセス
3. 簡単なメッセージを送信して応答が返ってくるか確認

## 4. 費用の管理

OpenAI APIの使用には費用がかかります。以下の方法で費用を管理してください：

- 月間支出上限の設定
- 定期的な使用量の確認
- APIリクエストの最適化（トークン数の削減など）

## 5. 参考リンク

- [OpenAI APIエラーコード](https://platform.openai.com/docs/guides/error-codes/api-errors)
- [OpenAI APIの使用量の管理](https://platform.openai.com/docs/guides/rate-limits)
- [OpenAI API料金](https://openai.com/pricing)
