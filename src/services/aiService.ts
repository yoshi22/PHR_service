// src/services/aiService.ts
// OpenAI APIとの連携用サービス

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
 * フェーズ4実装時に完成させる
 */
export const getChatCompletion = async (
  messages: ChatMessage[],
  healthData?: Record<string, any>
): Promise<AIResponse> => {
  try {
    // TODO: Firebase CloudFunctionsを経由してOpenAI APIを呼び出す実装
    // 現時点ではダミー応答を返す
    
    console.log('AI APIリクエスト:', { messages, healthData });
    
    // APIリクエストの実装プレースホルダ
    return {
      message: 'これはダミーレスポンスです。実際の実装ではGPT-4oからの応答が返ります。',
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
 * フェーズ4実装時にFirestoreに保存する機能を実装
 */
export const saveConversation = async (userId: string, messages: ChatMessage[]): Promise<void> => {
  try {
    // TODO: Firestoreに会話履歴を保存する実装
    console.log('会話履歴を保存:', { userId, messageCount: messages.length });
  } catch (error) {
    console.error('会話履歴の保存に失敗しました', error);
  }
};

/**
 * 会話履歴を取得する
 * フェーズ4実装時にFirestoreから読み込む機能を実装
 */
export const getConversationHistory = async (userId: string): Promise<ChatMessage[]> => {
  try {
    // TODO: Firestoreから会話履歴を取得する実装
    console.log('会話履歴を取得:', userId);
    return [];
  } catch (error) {
    console.error('会話履歴の取得に失敗しました', error);
    return [];
  }
};
