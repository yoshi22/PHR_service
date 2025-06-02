import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { auth } from '../firebase';
import {
  HealthRiskType,
  getHealthRiskSettings,
  updateHealthRiskSettings,
  HealthRiskSettings
} from '../services/healthRiskService';

export default function HealthRiskSettingsSection() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<HealthRiskSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // 設定を取得
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const userId = auth?.currentUser?.uid;
        if (!userId) return;

        const data = await getHealthRiskSettings(userId);
        setSettings(data);
      } catch (error) {
        console.error('Error fetching health risk settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // リスクタイプの有効/無効を切り替え
  const toggleRiskType = async (riskType: HealthRiskType) => {
    if (!settings || saving) return;

    // 現在の設定をコピー
    const updatedSettings = { ...settings };
    
    // リスクタイプの有効/無効を切り替え
    if (updatedSettings.enabledRiskTypes.includes(riskType)) {
      updatedSettings.enabledRiskTypes = updatedSettings.enabledRiskTypes.filter(
        type => type !== riskType
      );
    } else {
      updatedSettings.enabledRiskTypes.push(riskType);
    }

    setSaving(true);
    try {
      await updateHealthRiskSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving health risk settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // 非アクティブ日数のしきい値を更新
  const updateInactivityThreshold = async (value: number) => {
    if (!settings || saving) return;

    // 1-7日の範囲に制限
    const threshold = Math.max(1, Math.min(7, value));
    
    // 現在の設定をコピー
    const updatedSettings = {
      ...settings,
      inactivityAlertThreshold: threshold
    };

    setSaving(true);
    try {
      await updateHealthRiskSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving inactivity threshold:', error);
    } finally {
      setSaving(false);
    }
  };

  // 活動量低下のしきい値を更新
  const updateDeclineThreshold = async (value: number) => {
    if (!settings || saving) return;

    // 10-50%の範囲に制限
    const threshold = Math.max(10, Math.min(50, value));
    
    // 現在の設定をコピー
    const updatedSettings = {
      ...settings,
      activityDeclineThreshold: threshold
    };

    setSaving(true);
    try {
      await updateHealthRiskSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving decline threshold:', error);
    } finally {
      setSaving(false);
    }
  };

  // リスクタイプの有効/無効をチェック
  const isRiskTypeEnabled = (riskType: HealthRiskType): boolean => {
    return settings?.enabledRiskTypes.includes(riskType) || false;
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
        <Ionicons name="warning" size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>健康リスク警告設定</Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>運動不足警告</Text>
        <Switch
          value={isRiskTypeEnabled(HealthRiskType.INACTIVITY)}
          onValueChange={() => toggleRiskType(HealthRiskType.INACTIVITY)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isRiskTypeEnabled(HealthRiskType.INACTIVITY) ? colors.primary : '#f4f3f4'}
          disabled={saving}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>活動量低下警告</Text>
        <Switch
          value={isRiskTypeEnabled(HealthRiskType.DECLINED_ACTIVITY)}
          onValueChange={() => toggleRiskType(HealthRiskType.DECLINED_ACTIVITY)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isRiskTypeEnabled(HealthRiskType.DECLINED_ACTIVITY) ? colors.primary : '#f4f3f4'}
          disabled={saving}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>ストリーク消失警告</Text>
        <Switch
          value={isRiskTypeEnabled(HealthRiskType.STREAK_BROKEN)}
          onValueChange={() => toggleRiskType(HealthRiskType.STREAK_BROKEN)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isRiskTypeEnabled(HealthRiskType.STREAK_BROKEN) ? colors.primary : '#f4f3f4'}
          disabled={saving}
        />
      </View>

      <View style={styles.thresholdContainer}>
        <Text style={[styles.thresholdLabel, { color: colors.text }]}>
          非アクティブしきい値: {settings.inactivityAlertThreshold}日
        </Text>
        <View style={styles.thresholdButtons}>
          <TouchableOpacity
            style={[styles.thresholdButton, { backgroundColor: colors.card }]}
            onPress={() => updateInactivityThreshold(settings.inactivityAlertThreshold - 1)}
            disabled={settings.inactivityAlertThreshold <= 1 || saving}
          >
            <Text style={{ color: colors.text }}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.thresholdButton, { backgroundColor: colors.card }]}
            onPress={() => updateInactivityThreshold(settings.inactivityAlertThreshold + 1)}
            disabled={settings.inactivityAlertThreshold >= 7 || saving}
          >
            <Text style={{ color: colors.text }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.thresholdContainer}>
        <Text style={[styles.thresholdLabel, { color: colors.text }]}>
          活動量低下しきい値: {settings.activityDeclineThreshold}%
        </Text>
        <View style={styles.thresholdButtons}>
          <TouchableOpacity
            style={[styles.thresholdButton, { backgroundColor: colors.card }]}
            onPress={() => updateDeclineThreshold(settings.activityDeclineThreshold - 5)}
            disabled={settings.activityDeclineThreshold <= 10 || saving}
          >
            <Text style={{ color: colors.text }}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.thresholdButton, { backgroundColor: colors.card }]}
            onPress={() => updateDeclineThreshold(settings.activityDeclineThreshold + 5)}
            disabled={settings.activityDeclineThreshold >= 50 || saving}
          >
            <Text style={{ color: colors.text }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.text }]}>
        健康リスク警告は、あなたの活動パターンに基づいて潜在的な健康リスクを検出し、通知します。
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
  thresholdContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  thresholdLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  thresholdButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  thresholdButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
