import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../context/ToastContext';
import { useThemeContext } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useCoachFeatures } from '../hooks/useCoachFeatures';
import PrimaryButton from '../components/PrimaryButton';
import SettingsManager from '../components/SettingsManager';
import AdvancedSettings from '../components/AdvancedSettings';
import ReminderSettingsSection from '../components/ReminderSettingsSection';
import HealthRiskSettingsSection from '../components/HealthRiskSettingsSection';
import VoiceSettingsSection from '../components/VoiceSettingsSection';
import { 
  getNotificationSettings, 
  scheduleDailyStepReminder, 
  registerForPushNotificationsAsync 
} from '../services/notificationService';
import { getUserSettings, updateStepGoal, updateNotificationTime } from '../services/userSettingsService';
import { CoachSettings } from '../services/coachService';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * ProfileScreen for user settings and account management
 */
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { hasPermissions, request: requestPermissions, checkStatus } = usePermissions();
  const { showToast } = useToast();
  const { coachSettings, saveSettings: saveCoachSettings } = useCoachFeatures();
  const { updateLocalSettings } = useSettings();
  
  // State for theme and notification settings
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [stepGoal, setStepGoal] = useState('7500');
  const [loading, setLoading] = useState(false);
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Coach settings state
  const [localCoachSettings, setLocalCoachSettings] = useState<CoachSettings | null>(null);
  const [showCoachTimePicker, setShowCoachTimePicker] = useState(false);
  const [currentCoachTimePickerMode, setCurrentCoachTimePickerMode] = useState<{
    type: 'morningPlan' | 'eveningReflection' | 'weeklyReview' | 'quietFrom' | 'quietTo';
    time: Date;
  } | null>(null);

  // Load user settings on mount
  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      
      setLoading(true);
      try {
        // Check permissions status
        await checkStatus();
        
        // Load settings
        const [notifEnabled, settings] = await Promise.all([
          getNotificationSettings(),
          getUserSettings(user.uid)
        ]);
        
        setNotificationsEnabled(notifEnabled);
        setStepGoal(settings.stepGoal.toString());
        
        // Convert HH:mm string to Date object
        const [hours, minutes] = settings.notificationTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0);
        setNotificationTime(date);
      } catch (error) {
        console.error('Error loading settings:', error);
        showToast('error', '設定の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    }
    
    loadSettings();
  }, [user]);

  // Load coach settings when available
  useEffect(() => {
    if (coachSettings) {
      setLocalCoachSettings(coachSettings);
    }
  }, [coachSettings]);

  // Handle step goal update
  const handleStepGoalUpdate = useCallback(async () => {
    if (!user) {
      showToast('error', 'ユーザー認証が必要です');
      return;
    }
    
    try {
      const goal = parseInt(stepGoal);
      if (isNaN(goal) || goal < 1000 || goal > 50000) {
        return showToast('error', '目標歩数は1,000から50,000の間で設定してください');
      }

      await updateStepGoal(user.uid, goal);
      
      // Update settings context to trigger dashboard refresh
      updateLocalSettings({ stepGoal: goal });
      
      showToast('success', '目標歩数を更新しました');
    } catch (error) {
      console.error('Error updating step goal:', error);
      showToast('error', '目標歩数の更新に失敗しました');
    }
  }, [user, stepGoal, showToast, updateLocalSettings]);

  // Handle notification time change
  const handleTimeChange = useCallback(async (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (!selectedDate || !user) return;

    try {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      await updateNotificationTime(user.uid, timeString);
      await scheduleDailyStepReminder(notificationsEnabled, timeString);
      setNotificationTime(selectedDate);
      showToast('success', '通知時刻を更新しました');
    } catch (error) {
      console.error('Error updating notification time:', error);
      showToast('error', '通知時刻の更新に失敗しました');
    }
  }, [user, notificationsEnabled, showToast]);

  // Handle permissions check
  const handleCheckPermissions = () => {
    if (hasPermissions) {
      showToast('info', '健康データへのアクセスは許可されています', 'すべての機能が利用可能です');
    } else {
      Alert.alert(
        '健康データへのアクセスが必要です',
        'PHRアプリに健康データへのアクセスを許可しますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: '許可する', 
            onPress: async () => {
              try {
                await requestPermissions();
                showToast('success', '健康データへのアクセスが許可されました');
              } catch (error: any) {
                showToast('error', 'エラー', error.message);
              }
            } 
          },
        ]
      );
    }
  };
  
  // Handle logout
  const handleSignOut = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'ログアウト', 
          style: 'destructive',
          onPress: () => signOut() 
        },
      ]
    );
  };
  
  // Handle theme toggle using ThemeContext
  const { isDarkMode: themeDarkMode, toggleTheme } = useThemeContext();
  
  // Keep local state in sync with global theme context
  useEffect(() => {
    setIsDarkMode(themeDarkMode);
  }, [themeDarkMode]);
  
  const toggleDarkMode = () => {
    toggleTheme();
    showToast('info', `${!isDarkMode ? 'ダーク' : 'ライト'}モードに切り替えました`);
  };
  
  // Handle notifications toggle
  const toggleNotifications = async () => {
    if (!user) {
      showToast('error', 'ユーザー認証が必要です');
      return;
    }

    try {
      const newValue = !notificationsEnabled;
      
      // Request permissions if enabling notifications for the first time
      if (newValue) {
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          throw new Error('通知の許可が得られませんでした');
        }
      }
      
      // Update notification settings
      await scheduleDailyStepReminder(
        newValue,
        notificationTime.toLocaleTimeString('ja-JP', { 
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      );
      
      setNotificationsEnabled(newValue);
      showToast('info', `通知を${newValue ? '有効' : '無効'}にしました`);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showToast('error', '通知設定の更新に失敗しました');
    }
  };

  // Coach settings handlers
  const handleCoachSettingChange = (key: keyof CoachSettings, value: any) => {
    if (!localCoachSettings) return;
    
    setLocalCoachSettings(prevSettings => {
      if (!prevSettings) return null;
      
      return {
        ...prevSettings,
        [key]: value
      };
    });
  };

  // Get time as Date object for coach settings
  const getCoachTimeAsDate = (type: 'morningPlan' | 'eveningReflection' | 'weeklyReview' | 'quietFrom' | 'quietTo'): Date => {
    if (!localCoachSettings) return new Date();
    
    const date = new Date();
    let hours = 0;
    let minutes = 0;
    
    switch (type) {
      case 'morningPlan':
        hours = localCoachSettings.morningPlanTime.hour;
        minutes = localCoachSettings.morningPlanTime.minute;
        break;
      case 'eveningReflection':
        hours = localCoachSettings.eveningReflectionTime.hour;
        minutes = localCoachSettings.eveningReflectionTime.minute;
        break;
      case 'weeklyReview':
        hours = localCoachSettings.weeklyReviewTime.hour;
        minutes = localCoachSettings.weeklyReviewTime.minute;
        break;
      case 'quietFrom':
        hours = localCoachSettings.disableNotificationsFrom.hour;
        minutes = localCoachSettings.disableNotificationsFrom.minute;
        break;
      case 'quietTo':
        hours = localCoachSettings.disableNotificationsTo.hour;
        minutes = localCoachSettings.disableNotificationsTo.minute;
        break;
    }
    
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Show time picker for coach settings
  const showCoachTimePickerFor = (type: 'morningPlan' | 'eveningReflection' | 'weeklyReview' | 'quietFrom' | 'quietTo') => {
    setCurrentCoachTimePickerMode({
      type,
      time: getCoachTimeAsDate(type)
    });
    setShowCoachTimePicker(true);
  };

  // Handle coach time change
  const handleCoachTimeChange = (event: any, selectedDate?: Date) => {
    setShowCoachTimePicker(Platform.OS === 'ios');
    
    if (!currentCoachTimePickerMode || !selectedDate || !localCoachSettings) return;
    
    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();
    
    // Apply selected time to settings
    switch (currentCoachTimePickerMode.type) {
      case 'morningPlan':
        setLocalCoachSettings({
          ...localCoachSettings,
          morningPlanTime: { hour: hours, minute: minutes }
        });
        break;
      case 'eveningReflection':
        setLocalCoachSettings({
          ...localCoachSettings,
          eveningReflectionTime: { hour: hours, minute: minutes }
        });
        break;
      case 'weeklyReview':
        setLocalCoachSettings({
          ...localCoachSettings,
          weeklyReviewTime: { hour: hours, minute: minutes }
        });
        break;
      case 'quietFrom':
        setLocalCoachSettings({
          ...localCoachSettings,
          disableNotificationsFrom: { hour: hours, minute: minutes }
        });
        break;
      case 'quietTo':
        setLocalCoachSettings({
          ...localCoachSettings,
          disableNotificationsTo: { hour: hours, minute: minutes }
        });
        break;
    }
  };

  // Handle reminder frequency change
  const handleReminderFrequencyChange = (frequency: 'low' | 'medium' | 'high') => {
    if (!localCoachSettings) return;
    
    setLocalCoachSettings({
      ...localCoachSettings,
      remindersFrequency: frequency
    });
  };

  // Save coach settings
  const handleSaveCoachSettings = async () => {
    if (localCoachSettings) {
      try {
        await saveCoachSettings(localCoachSettings);
        showToast('success', 'コーチ設定を保存しました');
      } catch (error) {
        console.error('Error saving coach settings:', error);
        showToast('error', 'コーチ設定の保存に失敗しました');
      }
    }
  };

  // Format time for display
  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Format weekday for display
  const formatWeekday = (day: number): string => {
    const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    return weekdays[day];
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>プロフィール設定</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* New Settings Manager */}
      <SettingsManager
        notificationsEnabled={notificationsEnabled}
        onNotificationsToggle={toggleNotifications}
        isDarkMode={isDarkMode}
        onDarkModeToggle={toggleDarkMode}
        stepGoal={stepGoal}
        onStepGoalUpdate={handleStepGoalUpdate}
        onStepGoalChange={setStepGoal}
        AdvancedSettingsComponent={() => (
          <AdvancedSettings
            hasPermissions={hasPermissions}
            onCheckPermissions={handleCheckPermissions}
            notificationTime={notificationTime}
            onNotificationTimePress={() => setShowTimePicker(true)}
            localCoachSettings={localCoachSettings}
            onCoachSettingChange={(key: string, value: any) => handleCoachSettingChange(key as keyof CoachSettings, value)}
            showCoachTimePickerFor={showCoachTimePickerFor}
            formatTime={formatTime}
            formatWeekday={formatWeekday}
            onReminderFrequencyChange={handleReminderFrequencyChange}
          />
        )}
      />

      {/* Time pickers */}
      {showTimePicker && (
        <DateTimePicker
          value={notificationTime}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={handleTimeChange}
        />
      )}

      {showCoachTimePicker && currentCoachTimePickerMode && (
        <DateTimePicker
          value={currentCoachTimePickerMode.time}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleCoachTimeChange}
        />
      )}
      
      {/* Account Actions */}
      <View style={styles.accountSection}>
        <PrimaryButton 
          title="ログアウト" 
          onPress={handleSignOut}
          style={styles.signOutButton}
          textStyle={styles.signOutButtonText}
        />
        <Text style={styles.version}>PHRアプリ v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  accountSection: {
    backgroundColor: '#fff',
    marginVertical: 10,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    width: '100%',
  },
  signOutButtonText: {
    color: '#fff',
  },
  version: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    fontSize: 14,
  },
});
