import { getUserSettings, updateStepGoal, updateNotificationTime } from './userSettingsService';

// 設定変更意図の型定義
export type SettingsIntent = {
  type: 'stepGoal' | 'notificationTime' | 'unknown';
  value?: number | string;
  success: boolean;
  message: string;
};

/**
 * ユーザーのメッセージから設定変更の意図を検出して処理する
 */
export async function detectAndProcessSettingsIntent(
  userId: string,
  message: string
): Promise<SettingsIntent | null> {
  // メッセージを小文字に変換して検索しやすくする
  const normalizedMessage = message.toLowerCase();
  
  // 歩数目標変更の意図を検出
  const stepGoalMatch = normalizedMessage.match(
    /(歩数|目標|ステップ).*(設定|変更|更新).*?(\d{1,5})(歩|歩数|に|へ|ステップ)/
  );
  
  if (stepGoalMatch && stepGoalMatch[3]) {
    const newStepGoal = parseInt(stepGoalMatch[3]);
    if (!isNaN(newStepGoal) && newStepGoal >= 1000 && newStepGoal <= 50000) {
      try {
        await updateStepGoal(userId, newStepGoal);
        return {
          type: 'stepGoal',
          value: newStepGoal,
          success: true,
          message: `目標歩数を${newStepGoal}歩に更新しました。`
        };
      } catch (error) {
        console.error('Error updating step goal from chat:', error);
        return {
          type: 'stepGoal',
          success: false,
          message: '目標歩数の更新に失敗しました。'
        };
      }
    } else {
      return {
        type: 'stepGoal',
        success: false,
        message: '目標歩数は1,000から50,000歩の間で設定してください。'
      };
    }
  }
  
  // 通知時間変更の意図を検出
  const timeMatch = normalizedMessage.match(
    /(通知|リマインダー|アラート).*(時間|時刻).*(設定|変更|更新).*?(\d{1,2})(?:時|\:|：)(\d{1,2})(分)?/
  );
  
  if (timeMatch && timeMatch[4] && timeMatch[5]) {
    const hours = parseInt(timeMatch[4]);
    const minutes = parseInt(timeMatch[5]);
    
    if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      try {
        // HH:mm 形式にフォーマット
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        await updateNotificationTime(userId, formattedTime);
        return {
          type: 'notificationTime',
          value: formattedTime,
          success: true,
          message: `通知時間を${formattedTime}に更新しました。`
        };
      } catch (error) {
        console.error('Error updating notification time from chat:', error);
        return {
          type: 'notificationTime',
          success: false,
          message: '通知時間の更新に失敗しました。'
        };
      }
    } else {
      return {
        type: 'notificationTime',
        success: false,
        message: '無効な時刻形式です。00:00〜23:59の間で指定してください。'
      };
    }
  }
  
  // 設定変更の意図がないか検出できない場合
  return null;
}

/**
 * 一般的な設定を取得する
 * AIが現在の設定を参照するために使用
 */
export async function getGeneralSettings(userId: string) {
  try {
    const settings = await getUserSettings(userId);
    return {
      stepGoal: settings.stepGoal,
      notificationTime: settings.notificationTime
    };
  } catch (error) {
    console.error('Error getting general settings:', error);
    throw error;
  }
}
