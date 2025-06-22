import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { auth } from '../firebase';
import {
  ReminderType,
  ReminderSettings,
  getReminderSettings,
  updateReminderSettings
} from '../services/smartReminderService';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function ReminderSettingsSection() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  const [quietHoursStart, setQuietHoursStart] = useState<Date>(new Date());
  const [quietHoursEnd, setQuietHoursEnd] = useState<Date>(new Date());

  // 設定を取得
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const userId = auth?.currentUser?.uid;
        if (!userId) return;

        const data = await getReminderSettings(userId);
        setSettings(data);
        
        // 静寂時間を設定
        if (data) {
          const [startHours, startMinutes] = data.notificationQuietHours.start.split(':').map(Number);
          const [endHours, endMinutes] = data.notificationQuietHours.end.split(':').map(Number);
          
          const start = new Date();
          start.setHours(startHours, startMinutes, 0);
          setQuietHoursStart(start);
          
          const end = new Date();
          end.setHours(endHours, endMinutes, 0);
          setQuietHoursEnd(end);
        }
      } catch (error) {
        console.error('Error fetching reminder settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // リマインダータイプの有効/無効を切り替え
  const toggleReminderType = async (setting: keyof ReminderSettings) => {
    if (!settings || saving) return;
    
    // Type guard to ensure we're working with boolean properties
    if (setting === 'userId' || setting === 'notificationQuietHours' || setting === 'updatedAt') {
      return; // Skip non-boolean properties
    }

    const updatedSettings = { ...settings };
    (updatedSettings[setting] as boolean) = !(updatedSettings[setting] as boolean);

    setSaving(true);
    try {
      const success = await updateReminderSettings(updatedSettings);
      if (success) {
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // 静寂時間の開始時刻変更
  const handleStartTimeChange = async (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (!selectedDate || !settings) return;

    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const updatedSettings = {
      ...settings,
      notificationQuietHours: {
        ...settings.notificationQuietHours,
        start: timeString
      }
    };

    setSaving(true);
    try {
      const success = await updateReminderSettings(updatedSettings);
      if (success) {
        setSettings(updatedSettings);
        setQuietHoursStart(selectedDate);
      }
    } catch (error) {
      console.error('Error updating quiet hours start:', error);
    } finally {
      setSaving(false);
    }
  };

  // 静寂時間の終了時刻変更
  const handleEndTimeChange = async (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (!selectedDate || !settings) return;

    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const updatedSettings = {
      ...settings,
      notificationQuietHours: {
        ...settings.notificationQuietHours,
        end: timeString
      }
    };

    setSaving(true);
    try {
      const success = await updateReminderSettings(updatedSettings);
      if (success) {
        setSettings(updatedSettings);
        setQuietHoursEnd(selectedDate);
      }
    } catch (error) {
      console.error('Error updating quiet hours end:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.text }}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>リマインダー強化設定</Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>目標進捗リマインダー</Text>
        <Switch
          value={settings.goalProgressEnabled}
          onValueChange={() => toggleReminderType('goalProgressEnabled')}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={settings.goalProgressEnabled ? colors.primary : '#f4f3f4'}
          disabled={saving}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>ストリーク危険リマインダー</Text>
        <Switch
          value={settings.streakRiskEnabled}
          onValueChange={() => toggleReminderType('streakRiskEnabled')}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={settings.streakRiskEnabled ? colors.primary : '#f4f3f4'}
          disabled={saving}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>非活動リマインダー</Text>
        <Switch
          value={settings.inactivityEnabled}
          onValueChange={() => toggleReminderType('inactivityEnabled')}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={settings.inactivityEnabled ? colors.primary : '#f4f3f4'}
          disabled={saving}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>夕方のリマインダー</Text>
        <Switch
          value={settings.eveningNudgeEnabled}
          onValueChange={() => toggleReminderType('eveningNudgeEnabled')}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={settings.eveningNudgeEnabled ? colors.primary : '#f4f3f4'}
          disabled={saving}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>健康リスク警告</Text>
        <Switch
          value={settings.healthRiskEnabled}
          onValueChange={() => toggleReminderType('healthRiskEnabled')}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={settings.healthRiskEnabled ? colors.primary : '#f4f3f4'}
          disabled={saving}
        />
      </View>

      <View style={styles.quietHoursContainer}>
        <Text style={[styles.quietHoursTitle, { color: colors.text }]}>
          静寂時間（通知を出さない時間帯）
        </Text>

        <View style={styles.timeContainer}>
          <TouchableOpacity 
            style={[styles.timeButton, { backgroundColor: colors.card }]} 
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={[styles.timeText, { color: colors.text }]}>
              {quietHoursStart.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </Text>
          </TouchableOpacity>
          
          <Text style={{ color: colors.text, marginHorizontal: 8 }}>から</Text>
          
          <TouchableOpacity 
            style={[styles.timeButton, { backgroundColor: colors.card }]} 
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={[styles.timeText, { color: colors.text }]}>
              {quietHoursEnd.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={quietHoursStart}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={handleStartTimeChange}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={quietHoursEnd}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={handleEndTimeChange}
        />
      )}

      <Text style={[styles.description, { color: colors.text }]}>
        強化されたリマインダーは、目標達成に向けて適切なタイミングであなたをサポートします。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: 16,
  },
  quietHoursContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  quietHoursTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timeText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 16,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
});
