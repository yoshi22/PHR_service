import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingsManagerProps {
  // Basic settings props
  notificationsEnabled: boolean;
  onNotificationsToggle: () => void;
  isDarkMode: boolean;
  onDarkModeToggle: () => void;
  stepGoal: string;
  onStepGoalUpdate: () => void;
  onStepGoalChange: (value: string) => void;
  
  // Advanced settings component
  AdvancedSettingsComponent: React.ComponentType;
}

/**
 * Simplified settings manager with basic/advanced structure
 */
export default function SettingsManager({
  notificationsEnabled,
  onNotificationsToggle,
  isDarkMode,
  onDarkModeToggle,
  stepGoal,
  onStepGoalUpdate,
  onStepGoalChange,
  AdvancedSettingsComponent,
}: SettingsManagerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickSetupComplete, setQuickSetupComplete] = useState(false);

  // Master toggles for grouped settings
  const [allRemindersEnabled, setAllRemindersEnabled] = useState(true);
  const [allCoachingEnabled, setAllCoachingEnabled] = useState(false);
  const [allHealthAlertsEnabled, setAllHealthAlertsEnabled] = useState(true);

  const handleQuickSetup = () => {
    Alert.alert(
      'クイック設定',
      '推奨設定でアプリを設定しますか？\n・通知: ON\n・歩数目標: 8000歩\n・基本的なリマインダー: ON',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '設定する',
          onPress: () => {
            if (!notificationsEnabled) onNotificationsToggle();
            if (stepGoal !== '8000') {
              onStepGoalChange('8000');
              onStepGoalUpdate();
            }
            setAllRemindersEnabled(true);
            setQuickSetupComplete(true);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Quick Setup Banner */}
      {!quickSetupComplete && (
        <View style={styles.quickSetupBanner}>
          <View style={styles.quickSetupContent}>
            <Ionicons name="rocket-outline" size={24} color="#007AFF" />
            <View style={styles.quickSetupText}>
              <Text style={styles.quickSetupTitle}>クイック設定</Text>
              <Text style={styles.quickSetupSubtitle}>
                推奨設定で簡単にスタート
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.quickSetupButton} 
            onPress={handleQuickSetup}
          >
            <Text style={styles.quickSetupButtonText}>設定</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Basic Settings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings-outline" size={20} color="#333" />
          <Text style={styles.sectionTitle}>基本設定</Text>
        </View>

        {/* Essential Notifications Master Toggle */}
        <View style={styles.masterToggleContainer}>
          <View style={styles.masterToggleHeader}>
            <Text style={styles.masterToggleTitle}>通知</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={onNotificationsToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.masterToggleDescription}>
            歩数リマインダーと重要な健康通知
          </Text>
        </View>

        {/* Dark Mode */}
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>ダークモード</Text>
          <Switch
            value={isDarkMode}
            onValueChange={onDarkModeToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkMode ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {/* Step Goal - Simplified */}
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>1日の目標歩数</Text>
          <View style={styles.stepGoalSimple}>
            <Text style={styles.stepGoalValue}>{stepGoal}歩</Text>
            <TouchableOpacity 
              style={styles.stepGoalEdit}
              onPress={() => {
                // Navigate to step goal detail screen or show picker
                Alert.alert(
                  '目標歩数を変更',
                  '新しい目標歩数を選択してください',
                  [
                    { text: '5000歩', onPress: () => { onStepGoalChange('5000'); onStepGoalUpdate(); }},
                    { text: '7500歩', onPress: () => { onStepGoalChange('7500'); onStepGoalUpdate(); }},
                    { text: '10000歩', onPress: () => { onStepGoalChange('10000'); onStepGoalUpdate(); }},
                    { text: 'カスタム', onPress: () => setShowAdvanced(true) },
                    { text: 'キャンセル', style: 'cancel' },
                  ]
                );
              }}
            >
              <Text style={styles.stepGoalEditText}>変更</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Master Toggles for Advanced Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>機能の有効化</Text>
        
        {/* All Reminders Master Toggle */}
        <View style={styles.masterToggleContainer}>
          <View style={styles.masterToggleHeader}>
            <Text style={styles.masterToggleTitle}>リマインダー機能</Text>
            <Switch
              value={allRemindersEnabled}
              onValueChange={setAllRemindersEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={allRemindersEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.masterToggleDescription}>
            歩数・水分・薬の服用リマインダー
          </Text>
        </View>

        {/* All Coaching Master Toggle */}
        <View style={styles.masterToggleContainer}>
          <View style={styles.masterToggleHeader}>
            <Text style={styles.masterToggleTitle}>AIコーチング</Text>
            <Switch
              value={allCoachingEnabled}
              onValueChange={setAllCoachingEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={allCoachingEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.masterToggleDescription}>
            朝の計画・夜の振り返り・週次レビュー
          </Text>
        </View>

        {/* Health Alerts Master Toggle */}
        <View style={styles.masterToggleContainer}>
          <View style={styles.masterToggleHeader}>
            <Text style={styles.masterToggleTitle}>健康アラート</Text>
            <Switch
              value={allHealthAlertsEnabled}
              onValueChange={setAllHealthAlertsEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={allHealthAlertsEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.masterToggleDescription}>
            異常値検知・健康リスク警告
          </Text>
        </View>
      </View>

      {/* Advanced Settings Toggle */}
      <TouchableOpacity
        style={styles.advancedToggle}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <View style={styles.advancedToggleContent}>
          <Ionicons name="cog-outline" size={20} color="#666" />
          <Text style={styles.advancedToggleText}>詳細設定</Text>
        </View>
        <Ionicons
          name={showAdvanced ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
        />
      </TouchableOpacity>

      {/* Advanced Settings (Collapsible) */}
      {showAdvanced && (
        <View style={styles.advancedContainer}>
          <AdvancedSettingsComponent />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  quickSetupBanner: {
    backgroundColor: '#F0F8FF',
    borderColor: '#007AFF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickSetupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickSetupText: {
    marginLeft: 12,
    flex: 1,
  },
  quickSetupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quickSetupSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quickSetupButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  quickSetupButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  masterToggleContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  masterToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  masterToggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  masterToggleDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  stepGoalSimple: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepGoalValue: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  stepGoalEdit: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  stepGoalEditText: {
    fontSize: 12,
    color: '#007AFF',
  },
  advancedToggle: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  advancedToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advancedToggleText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  advancedContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
