// src/services/aiService.ts
// OpenAI APIとの連携用サービス
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// キャッシュ用の型定義
type CachedResponse = {
  message: string;
  timestamp: number;
  healthDataSnapshot?: string; // 健康データのスナップショット（JSONとして保存）
};

// キャッシュの有効期限（24時間）
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // ミリ秒

// キャッシュのキーを生成する
const generateCacheKey = (question: string): string => {
  // 文字列からスペース、改行などを削除し小文字に統一
  return `ai_cache_${question.toLowerCase().trim().replace(/\s+/g, '_')}`;
};

// キャッシュされたレスポンスを取得する
const getCachedResponse = async (question: string, healthData?: Record<string, any>): Promise<string | null> => {
  try {
    const cacheKey = generateCacheKey(question);
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const cachedResponse = JSON.parse(cachedData) as CachedResponse;
    const now = Date.now();
    
    // キャッシュの有効期限をチェック
    if (now - cachedResponse.timestamp > CACHE_EXPIRATION) {
      // 期限切れならキャッシュを削除
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
    
    // 健康データが変わっていたら新しい応答が必要
    if (healthData && cachedResponse.healthDataSnapshot) {
      const cachedHealthData = JSON.parse(cachedResponse.healthDataSnapshot);
      
      // 健康データの比較（簡易的な比較）
      if (JSON.stringify(cachedHealthData) !== JSON.stringify(healthData)) {
        return null;
      }
    }
    
    return cachedResponse.message;
  } catch (error) {
    console.error('キャッシュ読み込みエラー:', error);
    return null;
  }
};

// レスポンスをキャッシュに保存する
const cacheResponse = async (question: string, message: string, healthData?: Record<string, any>): Promise<void> => {
  try {
    const cacheKey = generateCacheKey(question);
    const cachedResponse: CachedResponse = {
      message,
      timestamp: Date.now(),
      healthDataSnapshot: healthData ? JSON.stringify(healthData) : undefined,
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedResponse));
  } catch (error) {
    console.error('キャッシュ保存エラー:', error);
  }
};

/**
 * OpenAI APIを利用してチャット応答を取得する
 */
export const getChatCompletion = async (
  messages: ChatMessage[],
  healthData?: Record<string, any>,
  userSettings?: Record<string, any>
): Promise<AIResponse> => {
  try {
    // ユーザーからの最新のメッセージを取得
    const userMessage = messages.find(msg => msg.role === 'user');
    
    if (!userMessage) {
      return { message: 'ユーザーメッセージが見つかりませんでした' };
    }
    
    // ユーザー設定情報があれば、システムプロンプトに追加
    if (userSettings) {
      const settingsInfo = `\n\n現在のユーザー設定情報:\n` +
        `- 目標歩数: ${userSettings.stepGoal}歩\n` +
        `- 通知時間: ${userSettings.notificationTime}`;
      
      // システムメッセージを作成
      const systemMessage: ChatMessage = {
        role: 'system',
        content: generateSystemPrompt(healthData) + settingsInfo
      };
      
      // システムメッセージをメッセージ配列に追加
      messages = [systemMessage, ...messages];
    }
    
    // キャッシュをチェック
    const cachedMessage = await getCachedResponse(userMessage.content, healthData);
    
    if (cachedMessage) {
      console.log('キャッシュからAIレスポンスを返却');
      return { message: cachedMessage };
    }
    
    // Firebase Functionsのリージョンを指定（東京リージョン）
    const functions = getFunctions(getApp(), 'asia-northeast1'); // 東京リージョン
    const generateAIChatResponse = httpsCallable(functions, 'generateAIChatResponse');

    // Firebase Functionsを呼び出し
    console.log('AI APIリクエスト送信中...');
    
    const result = await generateAIChatResponse({ messages, healthData });
    
    // レスポンスを取得
    const data = result.data as { message: string };
    
    console.log('AI APIレスポンス受信完了');
    
    // レスポンスをキャッシュに保存
    if (userMessage && data.message) {
      await cacheResponse(userMessage.content, data.message, healthData);
    }
    
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
医学的なアドバイスを提供する際は、必ず「これは医療アドバイスではなく、医師に相談することをお勧めします」と断りを入れてください。

アプリの設定について:
- ユーザーが歩数目標を変更したい場合は、「目標歩数を10000歩に設定して」のように伝えるよう案内してください。1000から50000歩の間で設定できます。
- ユーザーが通知時間を変更したい場合は、「通知時刻を20:30に設定して」のように伝えるよう案内してください。
- ユーザーはこのチャット内であなたに指示するだけで、上記の設定を変更できます。設定画面に移動する必要はありません。`;

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

/**
 * キャッシュをクリアする（テストやデバッグ用）
 */
export const clearResponseCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('ai_cache_'));
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`${cacheKeys.length}件のキャッシュをクリアしました`);
    }
  } catch (error) {
    console.error('キャッシュクリアエラー:', error);
  }
};
