import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays, isAfter, isBefore, isSameDay, set, parseISO } from 'date-fns';
import { CoachNotificationType, CoachSettings, DEFAULT_COACH_SETTINGS } from './coachService';

const NOTIFICATIONS_KEY = 'notifications_enabled';
const STEP_REMINDER_ID = 'daily-step-reminder';
const DEFAULT_NOTIFICATION_TIME = '20:00';
const MORNING_PLAN_ID = 'morning-plan-notification';
const EVENING_REFLECTION_ID = 'evening-reflection-notification';
const WEEKLY_REVIEW_ID = 'weekly-review-notification';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions (Push notifications disabled for Personal Team)
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    console.log(`[PushNotification] Initializing on platform: ${Platform.OS}`);

    // Personal Development Team では プッシュ通知をサポートしていないため、
    // ローカル通知のみを設定
    if (__DEV__) {
      console.log('🚧 [PushNotification] Push notifications disabled for Personal Development Team');
      console.log('📱 [PushNotification] Local notifications will be used instead');
      
      // ローカル通知の権限のみを要求
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log(`[PushNotification] Local notification permission status: ${existingStatus}`);
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        console.log(`[PushNotification] Permission request result: ${status}`);
        if (status !== 'granted') {
          console.warn('[PushNotification] Local notification permission denied');
          return null;
        }
      }
      
      return 'local-notifications-only';
    }

    // 本番環境でのプッシュ通知処理（Apple Developer Program が必要）
    let token;

    if (Platform.OS === 'android') {
      console.log('[PushNotification] Setting up Android notification channel');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      console.log('[PushNotification] Running on a physical device, checking permissions');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log(`[PushNotification] Existing permission status: ${existingStatus}`);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('[PushNotification] Permission not granted, requesting it now');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log(`[PushNotification] New permission status: ${finalStatus}`);
      }
      
      if (finalStatus !== 'granted') {
        console.log('[PushNotification] Failed to get push notification permissions');
        return null;
      }
      
      // Only get token if permission is granted
      console.log('[PushNotification] Permission granted, getting push token');
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: '9e7095cf-b85d-4532-bb80-3b4f132efabb', // Use your actual project ID
        })).data;
        console.log(`[PushNotification] Successfully retrieved token: ${token}`);
      } catch (error) {
        console.error('[PushNotification] Error getting push token:', error);
      }
      
    } else {
      console.log('[PushNotification] Not a physical device, skipping push token');
    }

    return token || null;
  } catch (error) {
    console.error('[PushNotification] Error during push notification setup:', error);
    return null;
  }
}

/**
 * Schedule daily step reminder notification
 */
export async function scheduleDailyStepReminder(enabled: boolean = true, notificationTime?: string): Promise<void> {
  try {
    // First cancel any existing reminder
    await Notifications.cancelScheduledNotificationAsync(STEP_REMINDER_ID);
    
    // Save notification preference
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(enabled));
    
    if (!enabled) return;
    
    // Parse notification time (use default if not provided or invalid)
    let timeString = notificationTime || DEFAULT_NOTIFICATION_TIME;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
      console.warn(`Invalid time format: ${timeString}, using default: ${DEFAULT_NOTIFICATION_TIME}`);
      timeString = DEFAULT_NOTIFICATION_TIME;
    }
    
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create date for next notification
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    // Schedule new reminder
    await Notifications.scheduleNotificationAsync({
      identifier: STEP_REMINDER_ID,
      content: {
        title: '今日の歩数目標を達成しましょう！',
        body: '少し歩いてみませんか？健康のために今日の目標を達成しましょう。',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.floor((scheduledTime.getTime() - now.getTime()) / 1000),
        repeats: true,
      },
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;  // Re-throw to handle in the UI
  }
}

/**
 * Show an immediate badge notification
 */
export async function showBadgeNotification(badgeName: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎉 新しいバッジを獲得しました！',
      body: `おめでとうございます！「${badgeName}」バッジを獲得しました。`,
      sound: 'default',
      data: { badgeName },
    },
    trigger: null, // Send immediately
  });
}

/**
 * Get current notification settings
 */
export async function getNotificationSettings(): Promise<boolean> {
  const settings = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
  return settings === null ? true : JSON.parse(settings);
}

/**
 * Register all listeners and initialize notifications
 */
export async function initializeNotifications() {
  console.log('[PushNotification] Starting notification initialization');
  
  try {
    const token = await registerForPushNotificationsAsync();
    console.log('[PushNotification] Push token result:', token ? 'Successfully obtained token' : 'No token obtained');
    
    // Check stored settings and initialize daily reminder
    console.log('[PushNotification] Checking notification settings');
    const enabled = await getNotificationSettings();
    console.log(`[PushNotification] Notifications enabled: ${enabled}`);
    
    if (enabled) {
      console.log('[PushNotification] Scheduling daily step reminder');
      await scheduleDailyStepReminder(enabled);
      console.log('[PushNotification] Daily step reminder scheduled');
    }

    // Initialize coaching notifications
    try {
      console.log('[PushNotification] Checking coaching settings');
      const settingsStr = await AsyncStorage.getItem('coach_settings');
      if (settingsStr) {
        console.log('[PushNotification] Found coaching settings, scheduling notifications');
        const settings: CoachSettings = JSON.parse(settingsStr);
        await scheduleCoachingNotifications(settings);
        console.log('[PushNotification] Coaching notifications scheduled');
      } else {
        console.log('[PushNotification] No coaching settings found');
      }
    } catch (error) {
      console.error('[PushNotification] Failed to initialize coaching notifications:', error);
    }
    
    console.log('[PushNotification] Notification initialization complete');
  } catch (error) {
    console.error('[PushNotification] Error during notification initialization:', error);
  }
}

/**
 * Schedule coaching related notifications based on user settings
 */
export async function scheduleCoachingNotifications(settings: CoachSettings): Promise<void> {
  if (!settings) return;
  
  try {
    // Cancel existing coaching notifications
    await cancelCoachingNotifications();
    
    // Schedule morning plan notification if enabled
    if (settings.enableMorningPlan) {
      await scheduleMorningPlanNotification(settings);
    }
    
    // Schedule evening reflection notification if enabled
    if (settings.enableEveningReflection) {
      await scheduleEveningReflectionNotification(settings);
    }
    
    // Schedule weekly review notification if enabled
    if (settings.enableWeeklyReview) {
      await scheduleWeeklyReviewNotification(settings);
    }
  } catch (error) {
    console.error('Failed to schedule coaching notifications:', error);
  }
}

/**
 * Cancel all coaching related notifications
 */
export async function cancelCoachingNotifications(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(MORNING_PLAN_ID);
  await Notifications.cancelScheduledNotificationAsync(EVENING_REFLECTION_ID);
  await Notifications.cancelScheduledNotificationAsync(WEEKLY_REVIEW_ID);
  
  // Cancel any goal reminders (we store the IDs in AsyncStorage)
  try {
    const reminderIdsStr = await AsyncStorage.getItem('goal_reminder_ids');
    if (reminderIdsStr) {
      const reminderIds = JSON.parse(reminderIdsStr);
      for (const id of reminderIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      await AsyncStorage.removeItem('goal_reminder_ids');
    }
  } catch (error) {
    console.error('Failed to cancel goal reminders:', error);
  }
}

/**
 * Schedule a morning plan notification
 */
export async function scheduleMorningPlanNotification(settings: CoachSettings): Promise<void> {
  // Calculate next notification time
  const now = new Date();
  let notificationDate = new Date();
  notificationDate.setHours(settings.morningPlanTime.hour);
  notificationDate.setMinutes(settings.morningPlanTime.minute);
  notificationDate.setSeconds(0);
  
  // If time has already passed today, schedule for tomorrow
  if (now > notificationDate) {
    notificationDate.setDate(notificationDate.getDate() + 1);
  }
  
  // Skip if in quiet hours
  if (isInQuietHours(notificationDate, settings)) {
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_PLAN_ID,
    content: {
      title: '今日の計画を立てましょう',
      body: '今日の目標や活動を計画する時間です。',
      data: { type: 'morningPlan' as CoachNotificationType },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notificationDate,
    },
  });
}

/**
 * Schedule an evening reflection notification
 */
export async function scheduleEveningReflectionNotification(settings: CoachSettings): Promise<void> {
  // Calculate next notification time
  const now = new Date();
  let notificationDate = new Date();
  notificationDate.setHours(settings.eveningReflectionTime.hour);
  notificationDate.setMinutes(settings.eveningReflectionTime.minute);
  notificationDate.setSeconds(0);
  
  // If time has already passed today, schedule for tomorrow
  if (now > notificationDate) {
    notificationDate.setDate(notificationDate.getDate() + 1);
  }
  
  // Skip if in quiet hours
  if (isInQuietHours(notificationDate, settings)) {
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_REFLECTION_ID,
    content: {
      title: '今日を振り返りましょう',
      body: '今日の成果と課題を振り返る時間です。',
      data: { type: 'eveningReflection' as CoachNotificationType },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notificationDate,
    },
  });
}

/**
 * Schedule a weekly review notification
 */
export async function scheduleWeeklyReviewNotification(settings: CoachSettings): Promise<void> {
  // Calculate next notification time
  const now = new Date();
  const today = now.getDay();
  const daysUntilTarget = (settings.weeklyReviewDay - today + 7) % 7;
  
  let notificationDate = addDays(now, daysUntilTarget);
  notificationDate.setHours(settings.weeklyReviewTime.hour);
  notificationDate.setMinutes(settings.weeklyReviewTime.minute);
  notificationDate.setSeconds(0);
  
  // If today is the target day and time has passed, schedule for next week
  if (daysUntilTarget === 0 && now > notificationDate) {
    notificationDate.setDate(notificationDate.getDate() + 7);
  }
  
  // Skip if in quiet hours
  if (isInQuietHours(notificationDate, settings)) {
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_REVIEW_ID,
    content: {
      title: '今週を振り返りましょう',
      body: '今週の成果を振り返り、来週の目標を立てましょう。',
      data: { type: 'weeklyReview' as CoachNotificationType },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notificationDate,
    },
  });
}

/**
 * Schedule a goal reminder notification
 */
export async function scheduleGoalReminder(
  goalId: string, 
  goalDescription: string, 
  settings: CoachSettings,
  customTime?: Date
): Promise<string> {
  // Generate a unique ID for this reminder
  const reminderId = `goal-reminder-${goalId}-${new Date().getTime()}`;
  
  // Calculate reminder time
  let reminderDate;
  if (customTime) {
    reminderDate = new Date(customTime);
  } else {
    reminderDate = new Date();
    
    // Set reminder time based on frequency setting
    switch (settings.remindersFrequency) {
      case 'high':
        reminderDate.setHours(reminderDate.getHours() + 3);
        break;
      case 'medium':
        reminderDate.setHours(reminderDate.getHours() + 6);
        break;
      case 'low':
        reminderDate.setHours(reminderDate.getHours() + 12);
        break;
    }
  }
  
  // Skip if in quiet hours
  if (isInQuietHours(reminderDate, settings)) {
    return '';
  }
  
  await Notifications.scheduleNotificationAsync({
    identifier: reminderId,
    content: {
      title: '目標のリマインダー',
      body: `「${goalDescription}」の達成に向けて取り組みましょう`,
      data: { 
        type: 'goalReminder' as CoachNotificationType,
        goalId 
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
  
  // Store the reminder ID
  try {
    const reminderIdsStr = await AsyncStorage.getItem('goal_reminder_ids');
    const reminderIds = reminderIdsStr ? JSON.parse(reminderIdsStr) : [];
    reminderIds.push(reminderId);
    await AsyncStorage.setItem('goal_reminder_ids', JSON.stringify(reminderIds));
  } catch (error) {
    console.error('Failed to store reminder ID:', error);
  }
  
  return reminderId;
}

/**
 * Schedule a just-in-time adaptive intervention (JITAI)
 */
export async function scheduleJITAI(
  activityType: string,
  message: string,
  settings: CoachSettings,
  customTime?: Date
): Promise<string> {
  // Generate a unique ID for this JITAI
  const jitaiId = `jitai-${activityType}-${new Date().getTime()}`;
  
  // Calculate notification time
  let notificationDate;
  if (customTime) {
    notificationDate = new Date(customTime);
  } else {
    notificationDate = new Date();
    notificationDate.setHours(notificationDate.getHours() + 1);
  }
  
  // Skip if in quiet hours
  if (isInQuietHours(notificationDate, settings)) {
    return '';
  }
  
  await Notifications.scheduleNotificationAsync({
    identifier: jitaiId,
    content: {
      title: getActivityTitle(activityType),
      body: message,
      data: { 
        type: 'activityReminder' as CoachNotificationType,
        activityType 
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notificationDate,
    },
  });
  
  return jitaiId;
}

/**
 * Get title based on activity type
 */
function getActivityTitle(activityType: string): string {
  switch (activityType) {
    case 'walking':
      return 'ウォーキングの時間です';
    case 'exercise':
      return 'エクササイズの時間です';
    case 'stretching':
      return 'ストレッチの時間です';
    case 'water':
      return '水分補給の時間です';
    case 'posture':
      return '姿勢を確認しましょう';
    default:
      return '活動リマインダー';
  }
}

/**
 * Check if a given time is within quiet hours
 */
function isInQuietHours(date: Date, settings: CoachSettings): boolean {
  const hour = date.getHours();
  const minute = date.getMinutes();
  
  const fromHour = settings.disableNotificationsFrom.hour;
  const fromMinute = settings.disableNotificationsFrom.minute;
  const toHour = settings.disableNotificationsTo.hour;
  const toMinute = settings.disableNotificationsTo.minute;
  
  // Handle cases where quiet hours cross midnight
  if (fromHour > toHour || (fromHour === toHour && fromMinute > toMinute)) {
    // Example: 22:00 to 07:00
    return (hour > fromHour || (hour === fromHour && minute >= fromMinute)) || 
           (hour < toHour || (hour === toHour && minute <= toMinute));
  } else {
    // Example: 23:00 to 23:30
    return (hour > fromHour || (hour === fromHour && minute >= fromMinute)) && 
           (hour < toHour || (hour === toHour && minute <= toMinute));
  }
}

/**
 * Send an immediate test notification - useful for verifying notification setup
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    console.log('[PushNotification] Sending test notification');
    
    // Check permission first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('[PushNotification] Permission not granted, cannot send test');
      return false;
    }
    
    // Send immediate notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'テスト通知',
        body: 'プッシュ通知が正常に動作しています。',
        sound: true,
        data: { type: 'test' },
      },
      trigger: null, // Send immediately
    });
    
    console.log(`[PushNotification] Test notification sent with ID: ${notificationId}`);
    return true;
  } catch (error) {
    console.error('[PushNotification] Error sending test notification:', error);
    return false;
  }
}
