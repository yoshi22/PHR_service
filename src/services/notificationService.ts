import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_KEY = 'notifications_enabled';
const STEP_REMINDER_ID = 'daily-step-reminder';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
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
export async function scheduleDailyStepReminder(enabled: boolean = true): Promise<void> {
  // First cancel any existing reminder
  await Notifications.cancelScheduledNotificationAsync(STEP_REMINDER_ID);
  
  // Save notification preference
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(enabled));
  
  if (!enabled) return;
  
  // Schedule new reminder - daily at 8:00 PM if not achieved step goal
  await Notifications.scheduleNotificationAsync({
    identifier: STEP_REMINDER_ID,
    content: {
      title: '今日の歩数目標を達成しましょう！',
      body: '少し歩いてみませんか？健康のために今日の目標を達成しましょう。',
      sound: 'default',
    },
    trigger: {
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });
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
