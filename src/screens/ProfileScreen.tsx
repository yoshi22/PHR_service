import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../context/ToastContext';
import PrimaryButton from '../components/PrimaryButton';
import { 
  getNotificationSettings, 
  scheduleDailyStepReminder, 
  registerForPushNotificationsAsync 
} from '../services/notificationService';

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
  
  // Load notification settings on mount
  useEffect(() => {
    async function loadSettings() {
      // Check permissions status
      await checkStatus();
      
      // Load notification settings
      try {
        const notifEnabled = await getNotificationSettings();
        setNotificationsEnabled(notifEnabled);
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }
    
    loadSettings();
  }, []);
  
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
  
  // Handle theme toggle
  const toggleDarkMode = () => {
    setIsDarkMode(previous => {
      const newValue = !previous;
      showToast('info', `${newValue ? 'ダーク' : 'ライト'}モードに切り替えました`);
      return newValue;
    });
  };
  
  // Handle notifications toggle
  const toggleNotifications = async () => {
    try {
      const newValue = !notificationsEnabled;
      
      // Update notification settings
      await scheduleDailyStepReminder(newValue);
      setNotificationsEnabled(newValue);
      
      // Request permissions if enabling notifications for the first time
      if (newValue) {
        await registerForPushNotificationsAsync();
      }
      
      showToast('info', `通知を${newValue ? '有効' : '無効'}にしました`);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showToast('error', '通知設定の更新に失敗しました');
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>プロフィール設定</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      
      {/* Health Data Permissions */}
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
      </View>
      
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
});
