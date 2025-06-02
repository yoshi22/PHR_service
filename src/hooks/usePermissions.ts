import { useState, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { initHealthKit, initGoogleFit, checkPermissions } from '../services/healthService';
import Voice from '@react-native-voice/voice';

/**
 * Hook to request HealthKit / Google Fit and voice permissions
 */
export function usePermissions() {
  const [granted, setGranted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check current permission status
  const checkStatus = useCallback(async (): Promise<boolean> => {
    try {
      // ヘルスケア権限の確認
      const healthResult = await checkPermissions();
      
      // 音声認識権限の確認
      let voiceResult = true;
      if (Platform.OS === 'android') {
        const status = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        voiceResult = status;
      }
      
      const finalResult = healthResult && voiceResult;
      setGranted(finalResult);
      return finalResult;
    } catch (e) {
      console.error('権限の確認中にエラーが発生しました:', e);
      return false;
    }
  }, []);

  // リクエスト音声認識権限
  const requestVoicePermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "音声認識の許可",
            message: "音声入力機能を使用するためにマイクへのアクセスが必要です。",
            buttonPositive: "OK",
            buttonNegative: "キャンセル"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('音声認識権限リクエストエラー:', err);
        return false;
      }
    }
    // iOSの場合は、app.jsonのInfoPlist設定で自動的に処理される
    return true;
  }, []);

  // 全ての権限をリクエスト
  const request = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // ヘルスケア権限
      if (Platform.OS === 'ios') {
        await initHealthKit();
      } else {
        await initGoogleFit();
      }

      // 音声認識権限
      const voiceGranted = await requestVoicePermissions();
      if (!voiceGranted) {
        throw new Error('音声認識の権限が許可されませんでした');
      }

      setGranted(true);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [requestVoicePermissions]);

  return {
    granted,
    loading,
    error,
    request,
    checkStatus,
    requestVoicePermissions,
    hasPermissions: granted
  };
}
