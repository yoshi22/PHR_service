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
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../context/ToastContext';
import { useThemeContext } from '../context/ThemeContext';
import PrimaryButton from '../components/PrimaryButton';
import ReminderSettingsSection from '../components/ReminderSettingsSection';
import HealthRiskSettingsSection from '../components/HealthRiskSettingsSection';
import VoiceSettingsSection from '../components/VoiceSettingsSection';
import { 
  getNotificationSettings, 
  scheduleDailyStepReminder, 
  registerForPushNotificationsAsync 
} from '../services/notificationService';
import { getUserSettings, updateStepGoal, updateNotificationTime } from '../services/userSettingsService';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * ProfileScreen for user settings and account management
 */
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { hasPermissions, request: requestPermissions, checkStatus } = usePermissions();
  const { showToast } = useToast();
  
  // State for theme and notification settings
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [stepGoal, setStepGoal] = useState('7500');
  const [loading, setLoading] = useState(false);
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

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
      showToast('success', '目標歩数を更新しました');
    } catch (error) {
      console.error('Error updating step goal:', error);
      showToast('error', '目標歩数の更新に失敗しました');
    }
  }, [user, stepGoal, showToast]);

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

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>プロフィール設定</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        
        {/* Health Data Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>健康データ</Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={handleCheckPermissions}
          >
            <Text style={styles.permissionButtonText}>
              {hasPermissions ? '✓ 許可済み' : '健康データへのアクセスを許可する'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.helpText}>
            PHRアプリが歩数や活動データを読み取るために、
            {Platform.OS === 'ios' ? 'ヘルスケア' : 'Google Fit'}へのアクセス許可が必要です。
          </Text>

          <View style={[styles.setting, styles.stepGoalSetting]}>
            <Text style={styles.settingLabel}>1日の目標歩数</Text>
            <View style={styles.stepGoalInputContainer}>
              <TextInput
                style={styles.stepGoalInput}
                value={stepGoal}
                onChangeText={setStepGoal}
                keyboardType="numeric"
                maxLength={5}
                placeholder="7500"
              />
              <Text style={styles.stepGoalUnit}>歩</Text>
              <TouchableOpacity 
                style={styles.stepGoalButton}
                onPress={handleStepGoalUpdate}
              >
                <Text style={styles.stepGoalButtonText}>更新</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>表示設定</Text>
          <View style={styles.setting}>
            <Text style={styles.settingLabel}>ダークモード</Text>
            <Switch 
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkMode ? '#007AFF' : '#f4f3f4'}
              testID="theme-toggle"
            />
          </View>
        </View>
        
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知設定</Text>
          <View style={styles.setting}>
            <Text style={styles.settingLabel}>毎日のリマインダー</Text>
            <Switch 
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          
          {notificationsEnabled && (
            <TouchableOpacity 
              style={[styles.setting, styles.timePickerButton]} 
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.settingLabel}>通知時刻</Text>
              <Text style={styles.timeText}>
                {notificationTime.toLocaleTimeString('ja-JP', { 
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false 
                })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 強化されたリマインダー設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>リマインダー強化</Text>
          <ReminderSettingsSection />
        </View>

        {/* 健康リスク警告設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>健康リスク警告</Text>
          <HealthRiskSettingsSection />
        </View>
        
        {/* 音声機能設定 */}
        <View style={styles.section}>
          <VoiceSettingsSection />
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={notificationTime}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={handleTimeChange}
          />
        )}
        
        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <View style={styles.buttonContainer}>
            <PrimaryButton 
              title="ログアウト" 
              onPress={handleSignOut}
              style={styles.signOutButton}
              textStyle={styles.signOutButtonText}
            />
          </View>
        </View>
        
        <Text style={styles.version}>PHRアプリ v1.0.0</Text>
      </ScrollView>
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
  section: {
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  permissionButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 8,
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
  },
  signOutButtonText: {
    color: '#fff',
  },
  version: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#999',
    fontSize: 14,
  },
  stepGoalSetting: {
    marginTop: 16,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  stepGoalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stepGoalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#333',
  },
  stepGoalUnit: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  stepGoalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  stepGoalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  timePickerButton: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  timeText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
