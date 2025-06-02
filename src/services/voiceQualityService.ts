import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const VOICE_QUALITY_SETTINGS_KEY = 'voice_quality_settings';
const VOICE_API_SELECTION_KEY = 'voice_api_selection';
const DEFAULT_LANGUAGE = 'ja-JP';

export type VoiceQualitySettings = {
  pitch: number; // 0.5-2.0
  rate: number; // 0.5-2.0
  voiceName?: string; // Platform-specific voice name
  language: string;
};

export type VoiceApiType = 'native' | 'google' | 'amazon' | 'azure';

const defaultSettings: VoiceQualitySettings = {
  pitch: 1.0,
  rate: 0.9,
  language: DEFAULT_LANGUAGE
};

/**
 * Get all available voices for the current platform
 */
export async function getAvailableVoices(language?: string): Promise<Speech.Voice[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    
    // Filter by language if specified
    if (language) {
      return voices.filter(voice => voice.language === language);
    }
    
    return voices;
  } catch (error) {
    console.error('Error getting available voices:', error);
    return [];
  }
}

/**
 * Get current voice quality settings
 */
export async function getVoiceQualitySettings(): Promise<VoiceQualitySettings> {
  try {
    const savedSettings = await AsyncStorage.getItem(VOICE_QUALITY_SETTINGS_KEY);
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  } catch (error) {
    console.error('Error loading voice quality settings:', error);
    return defaultSettings;
  }
}

/**
 * Update voice quality settings
 */
export async function updateVoiceQualitySettings(settings: Partial<VoiceQualitySettings>): Promise<VoiceQualitySettings> {
  try {
    const currentSettings = await getVoiceQualitySettings();
    const newSettings = { ...currentSettings, ...settings };
    
    await AsyncStorage.setItem(VOICE_QUALITY_SETTINGS_KEY, JSON.stringify(newSettings));
    return newSettings;
  } catch (error) {
    console.error('Error saving voice quality settings:', error);
    return defaultSettings;
  }
}

/**
 * Get selected voice API type
 */
export async function getVoiceApiSelection(): Promise<VoiceApiType> {
  try {
    const apiType = await AsyncStorage.getItem(VOICE_API_SELECTION_KEY);
    return (apiType as VoiceApiType) || 'native';
  } catch (error) {
    console.error('Error getting voice API selection:', error);
    return 'native';
  }
}

/**
 * Update selected voice API type
 */
export async function updateVoiceApiSelection(apiType: VoiceApiType): Promise<void> {
  try {
    await AsyncStorage.setItem(VOICE_API_SELECTION_KEY, apiType);
  } catch (error) {
    console.error('Error updating voice API selection:', error);
  }
}

/**
 * High-quality text-to-speech using the selected API
 * This implementation uses Expo's built-in speech capabilities with optimized settings.
 * For production, you can integrate external APIs like Google Cloud TTS, Amazon Polly, or Azure
 */
export async function speakWithHighQuality(text: string, options?: Partial<VoiceQualitySettings>): Promise<void> {
  try {
    const apiType = await getVoiceApiSelection();
    const settings = await getVoiceQualitySettings();
    const mergedOptions = { ...settings, ...options };
    
    switch (apiType) {
      case 'google':
        // For production: Implement Google Cloud Text-to-Speech API here
        // This would require setting up API keys and making HTTP requests
        console.log('Using Google TTS API (mock)');
        return await speakWithNative(text, mergedOptions);
        
      case 'amazon':
        // For production: Implement Amazon Polly API here
        console.log('Using Amazon Polly API (mock)');
        return await speakWithNative(text, mergedOptions);
        
      case 'azure':
        // For production: Implement Azure Speech Service API here
        console.log('Using Azure Speech API (mock)');
        return await speakWithNative(text, mergedOptions);
        
      case 'native':
      default:
        return await speakWithNative(text, mergedOptions);
    }
  } catch (error) {
    console.error('Error with high-quality speech:', error);
    throw new Error('音声合成に失敗しました');
  }
}

/**
 * Speak using native TTS with optimized settings
 */
async function speakWithNative(text: string, options: VoiceQualitySettings): Promise<void> {
  // Enhanced voice selection for iOS
  const speechOptions: Speech.SpeechOptions = {
    language: options.language,
    pitch: options.pitch,
    rate: Platform.OS === 'ios' ? options.rate : options.rate * 0.75, // Android needs slower rate
    voice: options.voiceName
  };
  
  await Speech.speak(text, speechOptions);
}

/**
 * Stop currently speaking text
 */
export function stopSpeaking(): void {
  Speech.stop();
}

/**
 * Check if device is currently speaking
 */
export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    console.error('Error checking if speaking:', error);
    return false;
  }
}
