// functions/src/index.ts

import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Import AI and Feedback functions
import * as aiFunctions from './ai-functions';
import * as feedbackFunctions from './feedback-functions';

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * 毎日 08:00 (Cron: '0 8 * * *') に実行
 */
export const checkDailySteps = functions.pubsub
  .schedule("0 8 * * *")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    const threshold = 5000;
    const today = new Date().toISOString().split("T")[0];

    logger.log(`[checkDailySteps] date=${today}, threshold=${threshold}`);

    try {
      const snapshot = await db
        .collection("userSteps")
        .where("date", "==", today)
        .where("steps", "<", threshold)
        .get();

      if (snapshot.empty) {
        logger.log("No users below threshold.");
        return null;
      }

      const tokens: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.fcmToken) tokens.push(data.fcmToken as string);
      });

      if (tokens.length === 0) {
        logger.log("No valid FCM tokens.");
        return null;
      }

      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: "今日は少し歩いてみましょう！",
          body: `${threshold} 歩未満です。小さな一歩でも健康に近づきます！`,
        },
      });

      logger.log(
        `Sent: success=${response.successCount}, ` +
        `failure=${response.failureCount}`
      );

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            logger.error(`token[${idx}] error:`, resp.error);
          }
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        logger.error("checkDailySteps error:", err.message);
      } else {
        logger.error("checkDailySteps error: Unknown error", err);
      }
    }

    return null;
  });

// AI機能のエクスポート（v2 functions）
export { generateAIChatResponse, getUserConversationHistory } from './ai-functions';

// フィードバック機能のエクスポート
export { submitUserFeedback } from './feedback-functions';
