import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_KEY = 'notifications_enabled';
const STEP_REMINDER_ID = 'daily-step-reminder';
const DEFAULT_NOTIFICATION_TIME = '20:00';

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
 * Request notification permissions
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    // Only get token if permission is granted
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: '9e7095cf-b85d-4532-bb80-3b4f132efabb', // Use your actual project ID
    })).data;
    
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token || null;
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
  const token = await registerForPushNotificationsAsync();
  console.log('Push token:', token);
  
  // Check stored settings and initialize daily reminder
  const enabled = await getNotificationSettings();
  await scheduleDailyStepReminder(enabled);
  
  return token;
}
