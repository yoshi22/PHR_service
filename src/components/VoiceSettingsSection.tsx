import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform, Modal, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useVoiceFeatures } from '../hooks/useVoiceFeatures';
import { setHomeLocation as setHomeLocationService, getVoiceReminderSettings, updateVoiceReminderSettings } from '../services/voiceReminderService';
import { useToast } from '../context/ToastContext';
import * as Speech from 'expo-speech';
import * as voiceQualityService from '../services/voiceQualityService';

/**
 * Voice Settings section for the Profile Screen
 */
export default function VoiceSettingsSection() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { speak, stopSpeaking } = useVoiceFeatures();
  const [exerciseRemindersEnabled, setExerciseRemindersEnabled] = useState(true);
  const [homeLocationSet, setHomeLocationSet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceQualityModal, setVoiceQualityModal] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<voiceQualityService.VoiceQualitySettings>({
    pitch: 1.0,
    rate: 0.9,
    language: 'ja-JP'
  });
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
  const [selectedApiType, setSelectedApiType] = useState<voiceQualityService.VoiceApiType>('native');
  
  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const reminderEnabled = await getVoiceReminderSettings();
        setExerciseRemindersEnabled(reminderEnabled);
        
        const qualitySettings = await voiceQualityService.getVoiceQualitySettings();
        setVoiceSettings(qualitySettings);
        
        const apiType = await voiceQualityService.getVoiceApiSelection();
        setSelectedApiType(apiType);
        
        const voices = await voiceQualityService.getAvailableVoices();
        setAvailableVoices(voices);
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

  // Save voice quality settings
  const saveVoiceQualitySettings = async () => {
    try {
      setLoading(true);
      await voiceQualityService.updateVoiceQualitySettings(voiceSettings);
      await voiceQualityService.updateVoiceApiSelection(selectedApiType);
      setVoiceQualityModal(false);
      showToast('success', '音声品質設定を保存しました');
    } catch (error) {
      console.error('Error saving voice quality settings:', error);
      showToast('error', '音声設定の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Test voice quality
  const testVoiceQuality = async () => {
    try {
      await voiceQualityService.speakWithHighQuality(
        'こんにちは、これは音声品質のテストです。', 
        voiceSettings
      );
    } catch (error) {
      console.error('Error testing voice quality:', error);
      showToast('error', '音声テストに失敗しました');
    }
  };

  // Modal for voice quality settings
  const renderVoiceQualityModal = () => (
    <Modal
      visible={voiceQualityModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setVoiceQualityModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>音声品質設定</Text>
          
          <ScrollView style={styles.settingsScrollView}>
            {/* Pitch Setting */}
            <Text style={styles.settingLabel}>音の高さ</Text>
            <Slider
              value={voiceSettings.pitch}
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.1}
              onValueChange={(value) => setVoiceSettings({...voiceSettings, pitch: value})}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor="#D0D0D0"
              thumbTintColor={colors.primary}
              style={styles.slider}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>低い</Text>
              <Text style={styles.sliderValue}>{voiceSettings.pitch.toFixed(1)}</Text>
              <Text style={styles.sliderLabel}>高い</Text>
            </View>
            
            {/* Rate Setting */}
            <Text style={styles.settingLabel}>話す速さ</Text>
            <Slider
              value={voiceSettings.rate}
              minimumValue={0.5}
              maximumValue={1.5}
              step={0.1}
              onValueChange={(value) => setVoiceSettings({...voiceSettings, rate: value})}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor="#D0D0D0"
              thumbTintColor={colors.primary}
              style={styles.slider}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>遅い</Text>
              <Text style={styles.sliderValue}>{voiceSettings.rate.toFixed(1)}</Text>
              <Text style={styles.sliderLabel}>速い</Text>
            </View>
            
            {/* API Type Selection */}
            <Text style={styles.settingLabel}>音声合成エンジン</Text>
            <View style={styles.apiSelectionContainer}>
              {(['native', 'google', 'amazon', 'azure'] as voiceQualityService.VoiceApiType[]).map((apiType) => (
                <TouchableOpacity
                  key={apiType}
                  style={[
                    styles.apiTypeButton,
                    selectedApiType === apiType && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedApiType(apiType)}
                >
                  <Text style={[
                    styles.apiTypeText,
                    selectedApiType === apiType && { color: 'white' }
                  ]}>
                    {apiType === 'native' ? 'デバイス標準' :
                     apiType === 'google' ? 'Google' :
                     apiType === 'amazon' ? 'Amazon' : 'Azure'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Voice Test Button */}
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.primary }]}
              onPress={testVoiceQuality}
            >
              <Ionicons name="volume-high" size={22} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.testButtonText}>音声をテスト</Text>
            </TouchableOpacity>
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setVoiceQualityModal(false)}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={saveVoiceQualitySettings}
            >
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
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
      
      {/* Voice Quality */}
      <View style={styles.setting}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>音声品質</Text>
          <Text style={styles.settingDescription}>
            音声の高さ、速さ、エンジンを調整
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.locationButton,
            { backgroundColor: colors.primary, opacity: loading ? 0.5 : 1 }
          ]}
          onPress={() => setVoiceQualityModal(true)}
          disabled={loading}
        >
          <Ionicons name="options" size={22} color="white" />
        </TouchableOpacity>
      </View>
      
      {/* Voice Explanation */}
      <View style={styles.explanationContainer}>
        <Ionicons name="information-circle-outline" size={20} color={colors.text} style={styles.infoIcon} />
        <Text style={[styles.explanationText, { color: colors.text }]}>
          AIチャット画面では、マイクボタンをタップすることで音声入力が可能です。音声モードをオンにすると、AIの回答も音声で再生されます。
        </Text>
      </View>
      
      {/* Voice Quality Settings Modal */}
      {renderVoiceQualityModal()}
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
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  settingsScrollView: {
    maxHeight: 400,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 13,
    color: '#666',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 10,
    backgroundColor: '#F2F2F2',
  },
  saveButton: {
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  apiSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  apiTypeButton: {
    width: '48%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    marginBottom: 10,
  },
  apiTypeText: {
    fontWeight: '500',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  testButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});
