import * as Speech from 'expo-speech';
// import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice, { SpeechErrorEvent, SpeechResultsEvent } from '@react-native-voice/voice';
import { Platform } from 'react-native';

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

// Speech recognition callbacks
let speechRecognitionCallbacks: {
  onStart?: () => void;
  onEnd?: () => void;
  onResults?: (results: string[]) => void;
  onError?: (error: string) => void;
} = {};

/**
 * Initialize voice recognition listeners
 */
function setupVoiceListeners(
  onSpeechStart?: () => void,
  onSpeechEnd?: () => void,
  onSpeechResults?: (results: string[]) => void,
  onSpeechPartial?: (partialResults: string[]) => void,
  onSpeechError?: (error: string) => void
) {
  // Store callbacks for later use
  speechRecognitionCallbacks = {
    onStart: onSpeechStart,
    onEnd: onSpeechEnd,
    onResults: onSpeechResults,
    onError: onSpeechError,
  };
  
  // Set up event listeners
  Voice.onSpeechStart = () => {
    console.log('Speech recognition started');
    onSpeechStart?.();
  };

  Voice.onSpeechEnd = () => {
    console.log('Speech recognition ended');
    onSpeechEnd?.();
  };

  Voice.onSpeechResults = (event: SpeechResultsEvent) => {
    console.log('Speech recognition results:', event.value);
    if (event.value && event.value.length > 0) {
      onSpeechResults?.(event.value);
    }
  };

  Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
    console.log('Speech recognition partial results:', event.value);
    if (event.value && event.value.length > 0) {
      onSpeechPartial?.(event.value);
    }
  };

  Voice.onSpeechError = (event: SpeechErrorEvent) => {
    console.error('Speech recognition error:', event);
    onSpeechError?.(event.error?.message || '音声認識エラー');
  };
}

/**
 * Remove voice recognition listeners
 */
function removeVoiceListeners() {
  Voice.onSpeechStart = () => {};
  Voice.onSpeechEnd = () => {};
  Voice.onSpeechResults = () => {};
  Voice.onSpeechPartialResults = () => {};
  Voice.onSpeechError = () => {};
}

/**
 * Start voice recognition with real implementation
 */
export async function startVoiceRecognition(
  locale: string = 'ja-JP',
  onSpeechStart?: () => void,
  onSpeechEnd?: () => void,
  onSpeechResults?: (results: string[]) => void,
  onSpeechError?: (error: string) => void
): Promise<void> {
  try {
    // Set up event listeners first
    setupVoiceListeners(
      onSpeechStart,
      onSpeechEnd,
      onSpeechResults,
      undefined, // Partial results not handled in the current implementation
      onSpeechError
    );
    
    // Check if already recording
    const isRecording = await Voice.isRecognizing();
    if (isRecording) {
      await Voice.stop();
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay before starting again
    }

    // Start listening
    await Voice.start(locale);
    
  } catch (error: any) {
    console.error('Error starting voice recognition:', error);
    removeVoiceListeners(); // Clean up listeners on error
    onSpeechError?.(error.message || 'Unknown error');
  }
}

/**
 * Stop voice recognition
 */
export async function stopVoiceRecognition(): Promise<void> {
  try {
    const isRecognizing = await Voice.isRecognizing();
    if (isRecognizing) {
      await Voice.stop();
    }
    speechRecognitionCallbacks.onEnd?.();
  } catch (error) {
    console.error('Error stopping voice recognition:', error);
  } finally {
    removeVoiceListeners();
  }
}

/**
 * Cancel voice recognition
 */
export async function cancelVoiceRecognition(): Promise<void> {
  try {
    const isRecognizing = await Voice.isRecognizing();
    if (isRecognizing) {
      await Voice.cancel();
    }
    // Clear callbacks
    speechRecognitionCallbacks = {};
  } catch (error) {
    console.error('Error canceling voice recognition:', error);
  } finally {
    removeVoiceListeners();
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

// Unified voice service object export for easier testing
export const voiceService = {
  startVoiceRecognition,
  stopVoiceRecognition,
  cancelVoiceRecognition,
  speakText,
  stopSpeaking,
  isSpeaking,
  isUserAtHome,
  isDayTimeForExercise,
  getCurrentLocation,
  initialVoiceState
};
