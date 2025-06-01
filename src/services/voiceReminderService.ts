import * as Notifications from 'expo-notifications';
// import * as Location from 'expo-location';
// import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { speakText } from './voiceService';

// Constants
const EXERCISE_REMINDER_MORNING_ID = 'exercise-reminder-morning';
const EXERCISE_REMINDER_EVENING_ID = 'exercise-reminder-evening';
const EXERCISE_REMINDER_ENABLED_KEY = 'exercise_reminder_enabled';

// Initialize voice notification settings (simplified)
export async function initializeVoiceReminders(): Promise<void> {
  try {
    // Check if reminders are enabled
    const enabled = await getVoiceReminderSettings();
    
    if (enabled) {
      // Schedule standard time-based reminders only
      await scheduleExerciseReminders(true);
    }
  } catch (error) {
    console.error('Error initializing voice reminders:', error);
  }
}

// Initialize time-based reminders
export async function initializeTimeBasedReminders(): Promise<void> {
  try {
    const enabled = await getVoiceReminderSettings();
    if (enabled) {
      await scheduleExerciseReminders(true);
    }
  } catch (error) {
    console.error('Error initializing time-based reminders:', error);
  }
}

// Initialize location-based reminders (Mock implementation)
export async function initializeLocationReminders(): Promise<boolean> {
  try {
    console.log('Location-based reminders temporarily disabled');
    
    // Initialize time-based reminders instead
    await initializeTimeBasedReminders();
    
    return true;
  } catch (error) {
    console.error('Error initializing location reminders:', error);
    return false;
  }
}

// Get current voice reminder settings
export async function getVoiceReminderSettings(): Promise<boolean> {
  try {
    const settings = await AsyncStorage.getItem(EXERCISE_REMINDER_ENABLED_KEY);
    return settings === null ? true : JSON.parse(settings);
  } catch (error) {
    console.error('Error getting voice reminder settings:', error);
    return false;
  }
}

// Update voice reminder settings
export async function updateVoiceReminderSettings(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(EXERCISE_REMINDER_ENABLED_KEY, JSON.stringify(enabled));
    
    // Update scheduled reminders
    await scheduleExerciseReminders(enabled);
    
  } catch (error) {
    console.error('Error updating voice reminder settings:', error);
    throw new Error('設定の更新に失敗しました');
  }
}

// Schedule time-based exercise reminders
export async function scheduleExerciseReminders(enabled: boolean): Promise<void> {
  try {
    // Cancel any existing reminders
    await Notifications.cancelScheduledNotificationAsync(EXERCISE_REMINDER_MORNING_ID);
    await Notifications.cancelScheduledNotificationAsync(EXERCISE_REMINDER_EVENING_ID);
    
    if (!enabled) return;
    
    // Schedule morning reminder (7:00 AM)
    await Notifications.scheduleNotificationAsync({
      identifier: EXERCISE_REMINDER_MORNING_ID,
      content: {
        title: '朝のエクササイズの時間です',
        body: '1日を活発に始めましょう。軽いストレッチや運動が気分を良くします。',
        sound: true,
        data: { type: 'morning_exercise' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 7,
        minute: 0,
        repeats: true,
      },
    });
    
    // Schedule evening reminder (6:00 PM)
    await Notifications.scheduleNotificationAsync({
      identifier: EXERCISE_REMINDER_EVENING_ID,
      content: {
        title: '夕方のエクササイズの時間です',
        body: '今日の疲れをリセットしましょう。軽い運動が睡眠の質を向上させます。',
        sound: true,
        data: { type: 'evening_exercise' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 18,
        minute: 0,
        repeats: true,
      },
    });
  } catch (error) {
    console.error('Error scheduling exercise reminders:', error);
    throw error;
  }
}

// Set home location for context-aware reminders (Mock implementation)
export async function setHomeLocation(): Promise<boolean> {
  try {
    console.log('Location feature temporarily disabled');
    return false;
  } catch (error) {
    console.error('Error setting home location:', error);
    return false;
  }
}
