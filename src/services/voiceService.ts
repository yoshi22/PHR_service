import * as Speech from 'expo-speech';
// import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Voice state interface
export interface VoiceState {
  isRecording: boolean;
  recognized: boolean;
  started: boolean;
  end: boolean;
  results: string[];
  partialResults: string[];
  error: string;
}

// Initial voice state
export const initialVoiceState: VoiceState = {
  isRecording: false,
  recognized: false,
  started: false,
  end: false,
  results: [],
  partialResults: [],
  error: '',
};

// Mock speech recognition (temporary implementation)
let mockRecognitionTimeout: NodeJS.Timeout | null = null;
let speechRecognitionCallbacks: {
  onStart?: () => void;
  onEnd?: () => void;
  onResults?: (results: string[]) => void;
  onError?: (error: string) => void;
} = {};

/**
 * Start voice recognition (Mock implementation)
 * In a real app, this would integrate with a speech recognition service
 */
export async function startVoiceRecognition(
  locale: string = 'ja-JP',
  onSpeechStart?: () => void,
  onSpeechEnd?: () => void,
  onSpeechResults?: (results: string[]) => void,
  onSpeechError?: (error: string) => void
): Promise<void> {
  try {
    // Store callbacks
    speechRecognitionCallbacks = {
      onStart: onSpeechStart,
      onEnd: onSpeechEnd,
      onResults: onSpeechResults,
      onError: onSpeechError,
    };

    // Mock start
    onSpeechStart?.();

    // Mock recognition after 3 seconds
    mockRecognitionTimeout = setTimeout(() => {
      // For demonstration, show a prompt to enter text
      Alert.prompt(
        '音声入力（デモ）',
        'このバージョンでは音声認識は模擬実装です。テキストを入力してください：',
        (text) => {
          if (text && text.trim()) {
            onSpeechResults?.([text.trim()]);
          }
          onSpeechEnd?.();
        },
        'plain-text',
        '',
        'default'
      );
    }, 500);

  } catch (error: any) {
    console.error('Error starting voice recognition:', error);
    onSpeechError?.(error.message || 'Unknown error');
  }
}

/**
 * Stop voice recognition
 */
export async function stopVoiceRecognition(): Promise<void> {
  try {
    if (mockRecognitionTimeout) {
      clearTimeout(mockRecognitionTimeout);
      mockRecognitionTimeout = null;
    }
    speechRecognitionCallbacks.onEnd?.();
  } catch (error) {
    console.error('Error stopping voice recognition:', error);
  }
}

/**
 * Cancel voice recognition
 */
export async function cancelVoiceRecognition(): Promise<void> {
  try {
    if (mockRecognitionTimeout) {
      clearTimeout(mockRecognitionTimeout);
      mockRecognitionTimeout = null;
    }
    // Clear callbacks
    speechRecognitionCallbacks = {};
  } catch (error) {
    console.error('Error canceling voice recognition:', error);
  }
}

/**
 * Speak text using speech synthesis
 */
export async function speakText(text: string, options: Speech.SpeechOptions = {}): Promise<void> {
  // Default options for Japanese language
  const defaultOptions: Speech.SpeechOptions = {
    language: 'ja-JP',
    pitch: 1.0,
    rate: 0.9,
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    await Speech.speak(text, mergedOptions);
  } catch (error) {
    console.error('Error with text-to-speech:', error);
    throw new Error('テキスト読み上げに失敗しました');
  }
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

/**
 * Check if user is at home based on location (Mock implementation)
 */
export async function isUserAtHome(): Promise<boolean> {
  try {
    // Mock implementation - always return false for now
    console.log('Location feature temporarily disabled');
    return false;
  } catch (error) {
    console.error('Error checking if user is at home:', error);
    return false;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Get stored home location from AsyncStorage
 */
async function getStoredHomeLocation(): Promise<{latitude: number, longitude: number} | null> {
  try {
    const storedLocation = await AsyncStorage.getItem('user_home_location');
    if (storedLocation) {
      return JSON.parse(storedLocation);
    }
    return null;
  } catch (error) {
    console.error('Error getting stored home location:', error);
    return null;
  }
}

/**
 * Check if current time is morning or evening for exercise
 */
export function isDayTimeForExercise(): 'morning' | 'evening' | null {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 10) {
    return 'morning';
  } else if (hour >= 17 && hour < 21) {
    return 'evening';
  }
  
  return null;
}

/**
 * Get current location (Mock implementation)
 */
export async function getCurrentLocation(): Promise<any | null> {
  try {
    // Mock implementation - return null for now
    console.log('Location feature temporarily disabled');
    return null;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}
