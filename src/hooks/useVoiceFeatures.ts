import { useState, useEffect, useCallback } from 'react';
import * as voiceService from '../services/voiceService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const HOME_LOCATION_KEY = 'user_home_location';
const EXERCISE_REMINDER_ENABLED_KEY = 'exercise_reminder_enabled';

/**
 * Hook for managing voice interactions in the app
 */
export function useVoiceFeatures() {
  const [voiceState, setVoiceState] = useState<voiceService.VoiceState>(
    voiceService.initialVoiceState
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [exerciseRemindersEnabled, setExerciseRemindersEnabled] = useState(true);

  // Load user preferences
  useEffect(() => {
    async function loadSettings() {
      const reminderSetting = await AsyncStorage.getItem(EXERCISE_REMINDER_ENABLED_KEY);
      if (reminderSetting !== null) {
        setExerciseRemindersEnabled(JSON.parse(reminderSetting));
      }
    }
    
    loadSettings();
  }, []);

  // Start voice recognition
  const startListening = useCallback(async () => {
    try {
      setVoiceState(prev => ({ ...prev, isRecording: true, error: '' }));
      
      await voiceService.startVoiceRecognition(
        Platform.OS === 'ios' ? 'ja-JP' : 'ja',
        // Speech start callback
        () => {
          setVoiceState(prev => ({ ...prev, started: true }));
        },
        // Speech end callback
        () => {
          setVoiceState(prev => ({ ...prev, end: true, isRecording: false }));
        },
        // Speech results callback
        (results) => {
          setVoiceState(prev => ({ 
            ...prev, 
            results,
            recognized: true
          }));
        },
        // Speech error callback
        (error) => {
          setVoiceState(prev => ({ 
            ...prev, 
            error,
            isRecording: false
          }));
        }
      );
    } catch (error: any) {
      setVoiceState(prev => ({ 
        ...prev, 
        error: error.message || 'Error starting voice recognition',
        isRecording: false
      }));
    }
  }, []);

  // Stop voice recognition
  const stopListening = useCallback(async () => {
    try {
      await voiceService.stopVoiceRecognition();
      setVoiceState(prev => ({ ...prev, isRecording: false }));
    } catch (error: any) {
      setVoiceState(prev => ({ 
        ...prev, 
        error: error.message || 'Error stopping voice recognition',
        isRecording: false
      }));
    }
  }, []);

  // Cancel voice recognition
  const cancelListening = useCallback(async () => {
    try {
      await voiceService.cancelVoiceRecognition();
      setVoiceState(prev => ({ 
        ...prev,
        isRecording: false,
        results: [],
        partialResults: []
      }));
    } catch (error) {
      console.error('Error canceling voice recognition:', error);
    }
  }, []);

  // Text to speech function
  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      await voiceService.speakText(text);
      
      // Check when speaking is done
      const checkInterval = setInterval(async () => {
        const stillSpeaking = await voiceService.isSpeaking();
        if (!stillSpeaking) {
          setIsSpeaking(false);
          clearInterval(checkInterval);
        }
      }, 500);
      
      // Safety timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        setIsSpeaking(false);
      }, 30000);
      
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsSpeaking(false);
    }
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  }, []);

  // Set home location
  const setHomeLocation = useCallback(async (latitude: number, longitude: number) => {
    try {
      await AsyncStorage.setItem(
        HOME_LOCATION_KEY, 
        JSON.stringify({ latitude, longitude })
      );
      return true;
    } catch (error) {
      console.error('Error saving home location:', error);
      return false;
    }
  }, []);

  // Toggle exercise reminders
  const toggleExerciseReminders = useCallback(async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(
        EXERCISE_REMINDER_ENABLED_KEY,
        JSON.stringify(enabled)
      );
      setExerciseRemindersEnabled(enabled);
      return true;
    } catch (error) {
      console.error('Error saving exercise reminder setting:', error);
      return false;
    }
  }, []);

  // Check if user is at home
  const checkIfUserIsAtHome = useCallback(async () => {
    return await voiceService.isUserAtHome();
  }, []);

  // Reset voice state
  const resetVoiceState = useCallback(() => {
    setVoiceState(voiceService.initialVoiceState);
  }, []);

  return {
    voiceState,
    isSpeaking,
    exerciseRemindersEnabled,
    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
    setHomeLocation,
    toggleExerciseReminders,
    checkIfUserIsAtHome,
    resetVoiceState,
  };
}
