import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReminderSettingsSection from './ReminderSettingsSection';
import HealthRiskSettingsSection from './HealthRiskSettingsSection';
import VoiceSettingsSection from './VoiceSettingsSection';

interface AdvancedSettingsProps {
  // All the complex settings props
  hasPermissions: boolean;
  onCheckPermissions: () => void;
  notificationTime: Date;
  onNotificationTimePress: () => void;
  localCoachSettings: any;
  onCoachSettingChange: (key: string, value: any) => void;
  showCoachTimePickerFor: (type: 'morningPlan' | 'eveningReflection' | 'weeklyReview' | 'quietFrom' | 'quietTo') => void;
  formatTime: (hour: number, minute: number) => string;
  formatWeekday: (day: number) => string;
  onReminderFrequencyChange: (frequency: 'low' | 'medium' | 'high') => void;
}

/**
 * Advanced settings component for detailed configuration
 */
export default function AdvancedSettings({
  hasPermissions,
  onCheckPermissions,
  notificationTime,
  onNotificationTimePress,
  localCoachSettings,
  onCoachSettingChange,
  showCoachTimePickerFor,
  formatTime,
  formatWeekday,
  onReminderFrequencyChange,
}: AdvancedSettingsProps) {
  return (
    <View style={styles.container}>
      {/* Health Data Permissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>データアクセス</Text>
        <TouchableOpacity 
          style={[
            styles.permissionButton,
            hasPermissions && styles.permissionButtonGranted
          ]}
          onPress={onCheckPermissions}
        >
          <Text style={[
            styles.permissionButtonText,
            hasPermissions && styles.permissionButtonTextGranted
          ]}>
            {hasPermissions ? '✓ 健康データアクセス許可済み' : '健康データへのアクセスを許可する'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification Time Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知時刻の詳細設定</Text>
        <TouchableOpacity 
          style={styles.setting} 
          onPress={onNotificationTimePress}
        >
          <Text style={styles.settingLabel}>毎日のリマインダー時刻</Text>
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>
              {notificationTime.toLocaleTimeString('ja-JP', { 
                hour: '2-digit',
                minute: '2-digit',
                hour12: false 
              })}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Enhanced Reminders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>リマインダー詳細設定</Text>
        <ReminderSettingsSection />
      </View>

      {/* Health Risk Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>健康リスク警告詳細</Text>
        <HealthRiskSettingsSection />
      </View>
      
      {/* Voice Features */}
      <View style={styles.section}>
        <VoiceSettingsSection />
      </View>

      {/* Detailed Coaching Settings */}
      {localCoachSettings && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AIコーチング詳細設定</Text>
            
            {/* Morning Plan Details */}
            {localCoachSettings.enableMorningPlan && (
              <TouchableOpacity
                style={styles.timePickerSetting}
                onPress={() => showCoachTimePickerFor('morningPlan')}
              >
                <Text style={styles.timePickerLabel}>朝の計画時刻</Text>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeDisplayText}>
                    {formatTime(localCoachSettings.morningPlanTime.hour, localCoachSettings.morningPlanTime.minute)}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            )}

            {/* Evening Reflection Details */}
            {localCoachSettings.enableEveningReflection && (
              <TouchableOpacity
                style={styles.timePickerSetting}
                onPress={() => showCoachTimePickerFor('eveningReflection')}
              >
                <Text style={styles.timePickerLabel}>夜の振り返り時刻</Text>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeDisplayText}>
                    {formatTime(localCoachSettings.eveningReflectionTime.hour, localCoachSettings.eveningReflectionTime.minute)}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            )}

            {/* Weekly Review Details */}
            {localCoachSettings.enableWeeklyReview && (
              <>
                <TouchableOpacity
                  style={styles.timePickerSetting}
                  onPress={() => showCoachTimePickerFor('weeklyReview')}
                >
                  <Text style={styles.timePickerLabel}>週間レビュー時刻</Text>
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeDisplayText}>
                      {formatTime(localCoachSettings.weeklyReviewTime.hour, localCoachSettings.weeklyReviewTime.minute)}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </View>
                </TouchableOpacity>

                <View style={styles.setting}>
                  <Text style={styles.timePickerLabel}>週間レビュー曜日</Text>
                  <Text style={styles.timeDisplayText}>
                    {formatWeekday(localCoachSettings.weeklyReviewDay)}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Quiet Hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>通知静寂時間</Text>
            
            <TouchableOpacity
              style={styles.setting}
              onPress={() => showCoachTimePickerFor('quietFrom')}
            >
              <Text style={styles.settingLabel}>静寂開始時刻</Text>
              <View style={styles.timeDisplay}>
                <Text style={styles.timeDisplayText}>
                  {formatTime(localCoachSettings.disableNotificationsFrom.hour, localCoachSettings.disableNotificationsFrom.minute)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setting}
              onPress={() => showCoachTimePickerFor('quietTo')}
            >
              <Text style={styles.settingLabel}>静寂終了時刻</Text>
              <View style={styles.timeDisplay}>
                <Text style={styles.timeDisplayText}>
                  {formatTime(localCoachSettings.disableNotificationsTo.hour, localCoachSettings.disableNotificationsTo.minute)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Reminder Frequency */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>リマインダー頻度</Text>
            
            <View style={styles.frequencySelector}>
              <TouchableOpacity
                style={[
                  styles.frequencyOption,
                  localCoachSettings.remindersFrequency === 'low' && styles.selectedFrequency
                ]}
                onPress={() => onReminderFrequencyChange('low')}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    localCoachSettings.remindersFrequency === 'low' && styles.selectedFrequencyText
                  ]}
                >
                  少なめ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.frequencyOption,
                  localCoachSettings.remindersFrequency === 'medium' && styles.selectedFrequency
                ]}
                onPress={() => onReminderFrequencyChange('medium')}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    localCoachSettings.remindersFrequency === 'medium' && styles.selectedFrequencyText
                  ]}
                >
                  普通
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.frequencyOption,
                  localCoachSettings.remindersFrequency === 'high' && styles.selectedFrequency
                ]}
                onPress={() => onReminderFrequencyChange('high')}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    localCoachSettings.remindersFrequency === 'high' && styles.selectedFrequencyText
                  ]}
                >
                  多め
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
      
      {/* Developer/Expert Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>エキスパート設定</Text>
        <TouchableOpacity
          style={styles.dangerousAction}
          onPress={() => {
            Alert.alert(
              '注意',
              'この操作は取り消せません。本当に実行しますか？',
              [
                { text: 'キャンセル', style: 'cancel' },
                { 
                  text: '実行', 
                  style: 'destructive',
                  onPress: () => {
                    // Reset all settings to default
                    Alert.alert('設定をリセットしました', '');
                  }
                },
              ]
            );
          }}
        >
          <Text style={styles.dangerousActionText}>設定を初期化</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  permissionButton: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonGranted: {
    backgroundColor: '#E8F5E8',
  },
  permissionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  permissionButtonTextGranted: {
    color: '#2E7D32',
  },
  timePickerSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timePickerLabel: {
    fontSize: 14,
    color: '#333',
  },
  timeDisplayText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  frequencySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  frequencyOption: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedFrequency: {
    backgroundColor: '#007AFF',
  },
  frequencyText: {
    fontSize: 14,
    color: '#333',
  },
  selectedFrequencyText: {
    color: 'white',
  },
  dangerousAction: {
    backgroundColor: '#FFE8E8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  dangerousActionText: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '500',
  },
});
