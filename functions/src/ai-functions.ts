// Firebase Functions for OpenAI API integration
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import { defineSecret } from "firebase-functions/params";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// OpenAI API設定
// Firebase Functions v2では環境変数の代わりにSecretを使用する
// defineSecretを使用して、Firebase上で設定されたSecretを参照する
// 参考: https://firebase.google.com/docs/functions/config-env?gen=2nd

// OpenAI APIキーをSecretとして定義
const openaiApiKeyParam = defineSecret("OPENAI_API_KEY");

// OpenAIクライアントを初期化する関数
const getOpenAIClient = () => {
  try {
    // Secretからキーを取得
    const apiKey = openaiApiKeyParam.value();
    
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured. Please set it using 'firebase functions:secrets:set OPENAI_API_KEY=YOUR_KEY'");
    }
    
    logger.log("Using OpenAI API key from secrets");
    return new OpenAI({ apiKey });
  } catch (error) {
    logger.error("Failed to initialize OpenAI client:", error);
    throw error;
  }
};

/**
 * OpenAI GPT-4oを使用してチャットメッセージに応答する関数
 */
export const generateAIChatResponse = onCall({ 
  region: "asia-northeast1", // 東京リージョンを指定
  enforceAppCheck: false,
  secrets: [openaiApiKeyParam] // OpenAI APIキーをSecretとして使用
}, async (request) => {
  // ユーザー認証チェック
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const { messages, healthData } = request.data as { messages: any[], healthData: any };
    const userId = request.auth.uid;

    // システムプロンプトを作成
    let systemPrompt = "あなたは個人健康記録アプリのAIアシスタントです。";
    systemPrompt += "ユーザーの健康に関する質問に応答し、適切なアドバイスを提供してください。";
    
    // 健康データがある場合はプロンプトに追加
    if (healthData) {
      systemPrompt += "\n\nユーザーの健康データ情報:";
      
      if (healthData.steps) {
        systemPrompt += `\n- 今日の歩数: ${healthData.steps}歩`;
      }
      
      if (healthData.heartRate) {
        systemPrompt += `\n- 平均心拍数: ${healthData.heartRate}bpm`;
      }
      
      if (healthData.sleepHours) {
        systemPrompt += `\n- 昨夜の睡眠時間: ${healthData.sleepHours}時間`;
      }
      
      systemPrompt += "\n\nこのデータを参考に、パーソナライズされたアドバイスを提供してください。";
    }
    
    systemPrompt += "\n\n医学的なアドバイスを提供する際は、必ず「これは医療アドバイスではなく、医師に相談することをお勧めします」と断りを入れてください。";

    // OpenAIにリクエスト
    const prompt = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // OpenAIクライアントを実行時に初期化
    const openai = getOpenAIClient();
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: prompt,
      max_tokens: 500,
      temperature: 0.7,
    });

    // レスポンスを取得
    const aiMessage = response.choices[0]?.message?.content || "応答を生成できませんでした。";

    // 会話履歴をFirestoreに保存
    await db.collection('users').doc(userId).collection('conversations').add({
      messages: [...messages, { role: 'assistant', content: aiMessage }],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      healthData: healthData || null,
    });

    return { message: aiMessage };
  } catch (error) {
    logger.error("AI response error:", error);
    throw new HttpsError(
      'internal',
      'AIレスポンスの生成中にエラーが発生しました',
      { originalError: error }
    );
  }
});

/**
 * ユーザーの会話履歴を取得する関数
 */
export const getUserConversationHistory = onCall({ 
  region: "asia-northeast1", // 東京リージョンを指定
  enforceAppCheck: false 
}, async (request) => {
  // ユーザー認証チェック
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const userId = request.auth.uid;
    const { limit = 10 } = request.data as { limit?: number };

    // 最新の会話履歴を取得
    const conversationsSnapshot = await db.collection('users')
      .doc(userId)
      .collection('conversations')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const conversations: any[] = [];
    conversationsSnapshot.forEach(doc => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { conversations };
  } catch (error) {
    logger.error("Error fetching conversation history:", error);
    throw new HttpsError(
      'internal',
      '会話履歴の取得中にエラーが発生しました',
      { originalError: error }
    );
  }
});
