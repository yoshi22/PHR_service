"use strict";
// functions/src/index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDailySteps = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
/**
 * 毎日 08:00 (Cron: '0 8 * * *') に実行
 */
exports.checkDailySteps = functions.pubsub
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
        const tokens = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fcmToken)
                tokens.push(data.fcmToken);
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
        logger.log(`Sent: success=${response.successCount}, ` +
            `failure=${response.failureCount}`);
        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    logger.error(`token[${idx}] error:`, resp.error);
                }
            });
        }
    }
    catch (err) {
        if (err instanceof Error) {
            logger.error("checkDailySteps error:", err.message);
        }
        else {
            logger.error("checkDailySteps error: Unknown error", err);
        }
    }
    return null;
});
