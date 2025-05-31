// src/services/aiService.ts
// OpenAI APIとの連携用サービス
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

// メッセージの型定義
export type ChatMessage = {
  role: 'user' | 'system' | 'assistant';
  content: string;
};

// AIレスポンスの型定義
export type AIResponse = {
  message: string;
  error?: string;
};

/**
 * OpenAI APIを利用してチャット応答を取得する
 */
export const getChatCompletion = async (
  messages: ChatMessage[],
  healthData?: Record<string, any>
): Promise<AIResponse> => {
  try {
    // Firebase Functionsのリージョンを指定（東京リージョン）
    const functions = getFunctions(getApp(), 'asia-northeast1'); // 東京リージョン
    const generateAIChatResponse = httpsCallable(functions, 'generateAIChatResponse');

    // Firebase Functionsを呼び出し
    console.log('AI APIリクエスト送信中...');
    
    const result = await generateAIChatResponse({ messages, healthData });
    
    // レスポンスを取得
    const data = result.data as { message: string };
    
    console.log('AI APIレスポンス受信完了');
    
    return {
      message: data.message
    };
    
  } catch (error: any) {
    console.error('AIレスポンスの取得に失敗しました', error);
    return {
      message: '',
      error: error.message || 'AIレスポンスの取得に失敗しました'
    };
  }
};

/**
 * ユーザーの健康データに基づいてシステムプロンプトを生成する
 */
export const generateSystemPrompt = (healthData?: Record<string, any>): string => {
  // ベースとなるシステムプロンプト
  let prompt = `あなたは個人健康記録アプリのAIアシスタントです。
ユーザーの健康に関する質問に答え、適切なアドバイスを提供してください。
医学的なアドバイスを提供する際は、必ず「これは医療アドバイスではなく、医師に相談することをお勧めします」と断りを入れてください。`;

  // 健康データがある場合は、それをプロンプトに追加
  if (healthData) {
    prompt += `\n\nユーザーの健康データ情報:`;
    
    if (healthData.steps) {
      prompt += `\n- 今日の歩数: ${healthData.steps}歩`;
    }
    
    if (healthData.heartRate) {
      prompt += `\n- 平均心拍数: ${healthData.heartRate}bpm`;
    }
    
    if (healthData.sleepHours) {
      prompt += `\n- 昨夜の睡眠時間: ${healthData.sleepHours}時間`;
    }
    
    prompt += `\n\nこのデータを参考に、パーソナライズされたアドバイスを提供してください。`;
  }

  return prompt;
};

/**
 * 会話履歴を保存する
 * 注: 会話履歴は現在generateAIChatResponse関数内で自動的に保存されるため、
 * このメソッドはクライアント側での独自保存が必要な場合のみ使用
 */
export const saveConversation = async (userId: string, messages: ChatMessage[]): Promise<void> => {
  try {
    // 現在はFirebase Functionsが自動的に保存するため、何もしない
    console.log('会話履歴はサーバー側で自動保存されます:', { userId, messageCount: messages.length });
    // CloudFunctionsが会話履歴を自動保存するため、クライアント側での実装は省略
  } catch (error) {
    console.error('会話履歴の保存に失敗しました', error);
  }
};

/**
 * 会話履歴を取得する
 */
export const getConversationHistory = async (userId: string): Promise<ChatMessage[]> => {
  try {
    const functions = getFunctions(getApp(), 'asia-northeast1'); // 東京リージョン
    const getUserConversationHistory = httpsCallable(functions, 'getUserConversationHistory');

    // Firebase Functionsを呼び出し
    console.log('会話履歴を取得中...');
    
    const result = await getUserConversationHistory({ limit: 10 });
    
    // レスポンスを取得
    const data = result.data as { conversations: any[] };
    
    if (!data.conversations || data.conversations.length === 0) {
      console.log('会話履歴なし');
      return [];
    }
    
    // 最新の会話の最初のメッセージを取得
    const latestConversation = data.conversations[0];
    console.log(`会話履歴取得完了: ${latestConversation.messages?.length || 0}件のメッセージ`);
    return latestConversation.messages || [];
  } catch (error) {
    console.error('会話履歴の取得に失敗しました', error);
    // エラー内容を詳細に表示することでデバッグを容易にする
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('エラースタック:', error.stack);
    }
    return [];
  }
};
