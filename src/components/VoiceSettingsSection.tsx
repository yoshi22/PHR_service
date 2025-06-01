import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useVoiceFeatures } from '../hooks/useVoiceFeatures';
import { setHomeLocation as setHomeLocationService, getVoiceReminderSettings, updateVoiceReminderSettings } from '../services/voiceReminderService';
import { useToast } from '../context/ToastContext';

/**
 * Voice Settings section for the Profile Screen
 */
export default function VoiceSettingsSection() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [exerciseRemindersEnabled, setExerciseRemindersEnabled] = useState(true);
  const [homeLocationSet, setHomeLocationSet] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const reminderEnabled = await getVoiceReminderSettings();
        setExerciseRemindersEnabled(reminderEnabled);
      } catch (error) {
        console.error('Error loading voice settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Handle exercise reminder toggle
  const toggleExerciseReminders = async (value: boolean) => {
    try {
      setLoading(true);
      await updateVoiceReminderSettings(value);
      setExerciseRemindersEnabled(value);
      showToast('success', `運動リマインダーを${value ? '有効' : '無効'}にしました`);
    } catch (error) {
      console.error('Error updating exercise reminder settings:', error);
      showToast('error', '設定の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // Set home location
  const handleSetHomeLocation = async () => {
    try {
      setLoading(true);
      const success = await setHomeLocationService();
      
      if (success) {
        setHomeLocationSet(true);
        showToast('success', '現在地を自宅として設定しました', '場所に基づいたリマインダーが有効になりました');
      } else {
        showToast('error', '位置情報へのアクセスが必要です', '設定から位置情報へのアクセスを許可してください');
      }
    } catch (error) {
      console.error('Error setting home location:', error);
      showToast('error', '自宅位置の設定に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>音声機能設定</Text>
      
      {/* Exercise Reminders Toggle */}
      <View style={styles.setting}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>運動リマインダー</Text>
          <Text style={styles.settingDescription}>
            朝と夕方に音声でエクササイズをリマインド
          </Text>
        </View>
        <Switch
          value={exerciseRemindersEnabled}
          onValueChange={toggleExerciseReminders}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={exerciseRemindersEnabled ? colors.primary : '#f4f3f4'}
          disabled={loading}
        />
      </View>
      
      {/* Home Location */}
      <View style={styles.setting}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>自宅での通知</Text>
          <Text style={styles.settingDescription}>
            {homeLocationSet ? '自宅位置が設定されています' : '自宅位置を設定して場所に基づいた通知を有効に'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.locationButton,
            { backgroundColor: colors.primary, opacity: loading ? 0.5 : 1 }
          ]}
          onPress={handleSetHomeLocation}
          disabled={loading}
        >
          <Ionicons name="home" size={22} color="white" />
        </TouchableOpacity>
      </View>
      
      {/* Voice Explanation */}
      <View style={styles.explanationContainer}>
        <Ionicons name="information-circle-outline" size={20} color={colors.text} style={styles.infoIcon} />
        <Text style={[styles.explanationText, { color: colors.text }]}>
          AIチャット画面では、マイクボタンをタップすることで音声入力が可能です。音声モードをオンにすると、AIの回答も音声で再生されます。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDDDDD',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666666',
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  explanationContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginTop: 16,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  explanationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
