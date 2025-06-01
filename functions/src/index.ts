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
 * 毎日 20:00 (Cron: '0 20 * * *') に実行
 * ユーザーごとの目標に対して進捗をチェック
 */
export const checkDailySteps = functions.pubsub
  .schedule("0 20 * * *")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    const today = new Date().toISOString().split("T")[0];
    logger.log(`[checkDailySteps] date=${today}`);

    try {
      // Get all user settings to check individual goals
      const userSettingsSnapshot = await db.collection("userSettings").get();
      const userSettings = new Map<string, number>();
      userSettingsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.stepGoal) {
          userSettings.set(doc.id, data.stepGoal);
        }
      });

      // Get today's steps for all users
      const stepsSnapshot = await db
        .collection("userSteps")
        .where("date", "==", today)
        .get();

      // Find users who haven't met their goals
      const usersToNotify: string[] = [];
      stepsSnapshot.forEach(doc => {
        const steps = doc.data().steps as number;
        const userId = doc.data().userId as string;
        const goal = userSettings.get(userId);
        
        if (goal && steps < goal) {
          usersToNotify.push(userId);
        }
      });

      if (usersToNotify.length === 0) {
        logger.log("No users below their goals.");
        return null;
      }

      // Get FCM tokens for users who need notification
      const tokensSnapshot = await db
        .collection("userTokens")
        .where("userId", "in", usersToNotify)
        .get();

      const tokens: string[] = [];
      tokensSnapshot.forEach(doc => {
        const token = doc.data().fcmToken;
        if (token) tokens.push(token);
      });

      if (tokens.length === 0) {
        logger.log("No valid FCM tokens.");
        return null;
      }

      // Send notifications with personalized messages
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: "今日の目標達成まであと少し！",
          body: "目標歩数まであと一歩です。今日も健康的に過ごしましょう！",
        },
        data: {
          type: "daily_steps_reminder",
          date: today,
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
