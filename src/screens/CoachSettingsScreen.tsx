import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCoachFeatures } from '../hooks/useCoachFeatures';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CoachSettings } from '../services/coachService';

const CoachSettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { coachSettings, saveSettings } = useCoachFeatures();
  const [settings, setSettings] = useState<CoachSettings | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimePickerMode, setCurrentTimePickerMode] = useState<{
    type: 'morningPlan' | 'eveningReflection' | 'weeklyReview' | 'quietFrom' | 'quietTo';
    time: Date;
  } | null>(null);

  // 設定がロードされたらローカル状態にセット
  useEffect(() => {
    if (coachSettings) {
      setSettings(coachSettings);
    }
  }, [coachSettings]);

  // 設定変更のハンドラ
  const handleSettingChange = (key: keyof CoachSettings, value: any) => {
    if (!settings) return;
    
    setSettings(prevSettings => {
      if (!prevSettings) return null;
      
      return {
        ...prevSettings,
        [key]: value
      };
    });
  };

  // タイムピッカー用の時間を取得
  const getTimeAsDate = (type: 'morningPlan' | 'eveningReflection' | 'weeklyReview' | 'quietFrom' | 'quietTo'): Date => {
    if (!settings) return new Date();
    
    const date = new Date();
    let hours = 0;
    let minutes = 0;
    
    switch (type) {
      case 'morningPlan':
        hours = settings.morningPlanTime.hour;
        minutes = settings.morningPlanTime.minute;
        break;
      case 'eveningReflection':
        hours = settings.eveningReflectionTime.hour;
        minutes = settings.eveningReflectionTime.minute;
        break;
      case 'weeklyReview':
        hours = settings.weeklyReviewTime.hour;
        minutes = settings.weeklyReviewTime.minute;
        break;
      case 'quietFrom':
        hours = settings.disableNotificationsFrom.hour;
        minutes = settings.disableNotificationsFrom.minute;
        break;
      case 'quietTo':
        hours = settings.disableNotificationsTo.hour;
        minutes = settings.disableNotificationsTo.minute;
        break;
    }
    
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // 時間選択を表示
  const showTimePickerFor = (type: 'morningPlan' | 'eveningReflection' | 'weeklyReview' | 'quietFrom' | 'quietTo') => {
    setCurrentTimePickerMode({
      type,
      time: getTimeAsDate(type)
    });
    setShowTimePicker(true);
  };

  // 時間選択が変更されたとき
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (!currentTimePickerMode || !selectedDate) return;
    
    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();
    
    if (!settings) return;
    
    // 選択された時間を設定に適用
    switch (currentTimePickerMode.type) {
      case 'morningPlan':
        setSettings({
          ...settings,
          morningPlanTime: { hour: hours, minute: minutes }
        });
        break;
      case 'eveningReflection':
        setSettings({
          ...settings,
          eveningReflectionTime: { hour: hours, minute: minutes }
        });
        break;
      case 'weeklyReview':
        setSettings({
          ...settings,
          weeklyReviewTime: { hour: hours, minute: minutes }
        });
        break;
      case 'quietFrom':
        setSettings({
          ...settings,
          disableNotificationsFrom: { hour: hours, minute: minutes }
        });
        break;
      case 'quietTo':
        setSettings({
          ...settings,
          disableNotificationsTo: { hour: hours, minute: minutes }
        });
        break;
    }
  };

  // 曜日選択
  const handleWeekdayChange = (day: number) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      weeklyReviewDay: day
    });
  };

  // リマインダー頻度変更
  const handleReminderFrequencyChange = (frequency: 'low' | 'medium' | 'high') => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      remindersFrequency: frequency
    });
  };

  // 設定保存
  const handleSaveSettings = async () => {
    if (settings) {
      await saveSettings(settings);
    }
  };

  // 時刻を表示用にフォーマット
  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // 曜日を表示用にフォーマット
  const formatWeekday = (day: number): string => {
    const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    return weekdays[day];
  };

  if (!settings) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        コーチング通知設定
      </Text>

      {/* 朝の計画 */}
      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingLabelContainer}>
          <Ionicons name="sunny-outline" size={20} color={colors.text} style={styles.settingIcon} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            朝の計画
          </Text>
        </View>
        <Switch
          value={settings.enableMorningPlan}
          onValueChange={(value) => handleSettingChange('enableMorningPlan', value)}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {settings.enableMorningPlan && (
        <TouchableOpacity
          style={[styles.timePickerRow, { borderBottomColor: colors.border }]}
          onPress={() => showTimePickerFor('morningPlan')}
        >
          <Text style={[styles.timePickerLabel, { color: colors.text }]}>
            朝の計画時刻
          </Text>
          <View style={styles.timeDisplay}>
            <Text style={[styles.timeText, { color: colors.primary }]}>
              {formatTime(settings.morningPlanTime.hour, settings.morningPlanTime.minute)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </View>
        </TouchableOpacity>
      )}

      {/* 夕方の振り返り */}
      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingLabelContainer}>
          <Ionicons name="moon-outline" size={20} color={colors.text} style={styles.settingIcon} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            夜の振り返り
          </Text>
        </View>
        <Switch
          value={settings.enableEveningReflection}
          onValueChange={(value) => handleSettingChange('enableEveningReflection', value)}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {settings.enableEveningReflection && (
        <TouchableOpacity
          style={[styles.timePickerRow, { borderBottomColor: colors.border }]}
          onPress={() => showTimePickerFor('eveningReflection')}
        >
          <Text style={[styles.timePickerLabel, { color: colors.text }]}>
            夜の振り返り時刻
          </Text>
          <View style={styles.timeDisplay}>
            <Text style={[styles.timeText, { color: colors.primary }]}>
              {formatTime(settings.eveningReflectionTime.hour, settings.eveningReflectionTime.minute)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </View>
        </TouchableOpacity>
      )}

      {/* 週間レビュー */}
      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingLabelContainer}>
          <Ionicons name="calendar-outline" size={20} color={colors.text} style={styles.settingIcon} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            週間レビュー
          </Text>
        </View>
        <Switch
          value={settings.enableWeeklyReview}
          onValueChange={(value) => handleSettingChange('enableWeeklyReview', value)}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {settings.enableWeeklyReview && (
        <>
          <TouchableOpacity
            style={[styles.timePickerRow, { borderBottomColor: colors.border }]}
            onPress={() => showTimePickerFor('weeklyReview')}
          >
            <Text style={[styles.timePickerLabel, { color: colors.text }]}>
              週間レビュー時刻
            </Text>
            <View style={styles.timeDisplay}>
              <Text style={[styles.timeText, { color: colors.primary }]}>
                {formatTime(settings.weeklyReviewTime.hour, settings.weeklyReviewTime.minute)}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </View>
          </TouchableOpacity>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.timePickerLabel, { color: colors.text }]}>
              週間レビュー曜日
            </Text>
            <TouchableOpacity
              style={styles.weekdaySelector}
              onPress={() => {
                // 曜日選択モーダルを表示（今回は実装省略）
              }}
            >
              <Text style={[styles.weekdayText, { color: colors.primary }]}>
                {formatWeekday(settings.weeklyReviewDay)}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* 静寂時間 */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
        通知静寂時間
      </Text>

      <TouchableOpacity
        style={[styles.timePickerRow, { borderBottomColor: colors.border }]}
        onPress={() => showTimePickerFor('quietFrom')}
      >
        <Text style={[styles.timePickerLabel, { color: colors.text }]}>
          静寂開始時刻
        </Text>
        <View style={styles.timeDisplay}>
          <Text style={[styles.timeText, { color: colors.primary }]}>
            {formatTime(settings.disableNotificationsFrom.hour, settings.disableNotificationsFrom.minute)}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.timePickerRow, { borderBottomColor: colors.border }]}
        onPress={() => showTimePickerFor('quietTo')}
      >
        <Text style={[styles.timePickerLabel, { color: colors.text }]}>
          静寂終了時刻
        </Text>
        <View style={styles.timeDisplay}>
          <Text style={[styles.timeText, { color: colors.primary }]}>
            {formatTime(settings.disableNotificationsTo.hour, settings.disableNotificationsTo.minute)}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </View>
      </TouchableOpacity>

      {/* リマインダー頻度 */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
        リマインダー頻度
      </Text>

      <View style={styles.frequencySelector}>
        <TouchableOpacity
          style={[
            styles.frequencyOption,
            settings.remindersFrequency === 'low' && [styles.selectedFrequency, { borderColor: colors.primary }]
          ]}
          onPress={() => handleReminderFrequencyChange('low')}
        >
          <Text
            style={[
              styles.frequencyText,
              { color: settings.remindersFrequency === 'low' ? colors.primary : colors.text }
            ]}
          >
            少なめ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.frequencyOption,
            settings.remindersFrequency === 'medium' && [styles.selectedFrequency, { borderColor: colors.primary }]
          ]}
          onPress={() => handleReminderFrequencyChange('medium')}
        >
          <Text
            style={[
              styles.frequencyText,
              { color: settings.remindersFrequency === 'medium' ? colors.primary : colors.text }
            ]}
          >
            標準
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.frequencyOption,
            settings.remindersFrequency === 'high' && [styles.selectedFrequency, { borderColor: colors.primary }]
          ]}
          onPress={() => handleReminderFrequencyChange('high')}
        >
          <Text
            style={[
              styles.frequencyText,
              { color: settings.remindersFrequency === 'high' ? colors.primary : colors.text }
            ]}
          >
            多め
          </Text>
        </TouchableOpacity>
      </View>

      {/* 保存ボタン */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSaveSettings}
      >
        <Text style={styles.saveButtonText}>設定を保存</Text>
      </TouchableOpacity>

      {/* タイムピッカー */}
      {showTimePicker && currentTimePickerMode && (
        <DateTimePicker
          value={currentTimePickerMode.time}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 28,
    borderBottomWidth: 1,
  },
  timePickerLabel: {
    fontSize: 14,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  weekdaySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  frequencySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedFrequency: {
    borderWidth: 1,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 40,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CoachSettingsScreen;
