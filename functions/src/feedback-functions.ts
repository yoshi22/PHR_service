import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * ユーザーフィードバックを受け取るCloud Function
 */
export const submitUserFeedback = functions
  .region('asia-northeast1')
  .https.onCall(async (data, context) => {
    try {
      // 認証を確認（匿名フィードバックも許可）
      const userId = context.auth?.uid || 'anonymous';
      
      // データの検証
      if (!data.title || !data.description || !data.feedbackType) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          '必須フィールドが欠けています'
        );
      }

      // フィードバックデータを準備
      const feedbackData = {
        userId: userId,
        userEmail: data.userEmail || context.auth?.token.email || 'anonymous',
        feedbackType: data.feedbackType,
        title: data.title,
        description: data.description,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'new',
        appVersion: data.appVersion || 'unknown',
        deviceInfo: data.deviceInfo || {},
        resolved: false
      };

      // Firestoreに保存
      const result = await admin.firestore()
        .collection('feedback')
        .add(feedbackData);

      // 管理者に通知（メール通知の例）
      if (data.feedbackType === 'bug') {
        await sendBugNotificationToAdmins(feedbackData);
      }
      
      // メトリクスを更新 - フィードバックタイプごとのカウント
      await updateFeedbackMetrics(data.feedbackType);

      return { 
        success: true, 
        id: result.id, 
        message: 'フィードバックを受け付けました' 
      };

    } catch (error) {
      console.error('フィードバック保存エラー:', error);
      
      throw new functions.https.HttpsError(
        'internal',
        'フィードバックの処理中にエラーが発生しました',
        error
      );
    }
  });

/**
 * フィードバック統計を更新する
 */
async function updateFeedbackMetrics(feedbackType: string): Promise<void> {
  const metricsRef = admin.firestore().collection('metrics').doc('feedback');
  
  await metricsRef.set({
    [`${feedbackType}Count`]: admin.firestore.FieldValue.increment(1),
    totalCount: admin.firestore.FieldValue.increment(1),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

/**
 * バグ報告を管理者に通知する
 */
async function sendBugNotificationToAdmins(feedbackData: any): Promise<void> {
  try {
    // TODO: 実際のメール送信処理を実装
    // Cloud Firestoreから管理者のメールリストを取得
    // SendGrid/Mailgun/Nodemailerなどを使用してメール送信
    
    console.log(`バグ報告通知を送信します: ${feedbackData.title}`);
    
  } catch (error) {
    console.error('管理者通知エラー:', error);
    // メール送信失敗は全体プロセス失敗にしない
  }
}
