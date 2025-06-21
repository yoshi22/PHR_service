import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useMiBand } from '../hooks/useMiBand';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import * as miBandService from '../services/miBandService';
import { useOptimizedHealth } from '../hooks/useOptimizedHealth';

const MiBandSetupScreen: React.FC = () => {
  const { colors } = useTheme();
  const optimizedHealth = useOptimizedHealth();
  const {
    isScanning,
    isConnecting,
    isConnected,
    device,
    heartRate,
    steps,
    lastSyncTime,
    error,
    startScan,
    connect,
    startHeartRateMonitoring,
    syncStepsData,
    syncWeeklyStepsHistory,
    getStoredWeeklySteps,
    disconnect,
    // 手動デバイス選択機能
    scannedDevices,
    showDeviceSelector,
    selectDevice,
    cancelDeviceSelection,
  } = useMiBand();

  const [refreshing, setRefreshing] = useState(false);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [isWeeklySync, setIsWeeklySync] = useState(false);

  // デバイスの接続
  const handleConnect = useCallback(async () => {
    if (!device) {
      const foundDevice = await startScan();
      if (foundDevice) {
        await connect(foundDevice);
      }
    } else {
      await connect();
    }
  }, [device, startScan, connect]);

  // データの同期
  const handleSync = useCallback(async () => {
    setRefreshing(true);
    try {
      // デバイスが接続されていなければ接続
      if (!isConnected) {
        await handleConnect();
      }
      
      // 各種データを同期
      if (isConnected) {
        await startHeartRateMonitoring();
        await syncStepsData();
      }
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [isConnected, handleConnect, startHeartRateMonitoring, syncStepsData]);

  // 週間履歴データを同期
  const handleWeeklySync = useCallback(async () => {
    setIsWeeklySync(true);
    try {
      // デバイスが接続されていなければ接続
      if (!isConnected) {
        await handleConnect();
      }
      
      if (isConnected) {
        console.log('📅 Starting weekly steps history sync...');
        const weeklyResult = await syncWeeklyStepsHistory();
        
        if (weeklyResult) {
          setWeeklyData(weeklyResult);
          console.log(`✅ Weekly data updated: ${weeklyResult.daily.length} days`);
        } else {
          // 保存されたデータを読み込み
          const storedData = await getStoredWeeklySteps();
          if (storedData) {
            setWeeklyData(storedData);
            console.log('📊 Using stored weekly data');
          }
        }
      }
    } catch (e) {
      console.error('Weekly sync failed:', e);
    } finally {
      setIsWeeklySync(false);
    }
  }, [isConnected, handleConnect, syncWeeklyStepsHistory, getStoredWeeklySteps]);

  // 保存された週間データを読み込み（初期化時）
  const loadStoredWeeklyData = useCallback(async () => {
    try {
      const storedData = await getStoredWeeklySteps();
      if (storedData) {
        setWeeklyData(storedData);
        console.log('📊 Loaded stored weekly data on init');
      }
    } catch (e) {
      console.error('Failed to load stored weekly data:', e);
    }
  }, [getStoredWeeklySteps]);

  // 初期化時に保存されたデータを読み込み
  useEffect(() => {
    loadStoredWeeklyData();
  }, [loadStoredWeeklyData]);

  // プル更新
  const onRefresh = useCallback(async () => {
    handleSync();
  }, [handleSync]);

  // デバイスの切断
  const handleDisconnect = useCallback(async () => {
    Alert.alert(
      'デバイス切断',
      'Mi Bandを切断しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '切断',
          onPress: async () => {
            await disconnect();
          },
          style: 'destructive',
        },
      ]
    );
  }, [disconnect]);

  // エラーがあればアラート表示
  useEffect(() => {
    if (error) {
      Alert.alert('エラー', error);
    }
  }, [error]);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Ionicons name="fitness" size={60} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Mi Band 連携</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Zepp Life経由でHealthKitと連携して歩数データを取得します
        </Text>
      </View>

      <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>連携状態</Text>
        <View style={styles.statusRow}>
          <Ionicons 
            name="heart" 
            size={24} 
            color="#4CAF50" 
          />
          <Text style={[styles.statusText, { color: colors.text }]}>
            HealthKit経由で連携
          </Text>
        </View>

        <View style={styles.deviceInfo}>
          <Text style={{ color: colors.text }}>データソース: Zepp Life → Apple Health</Text>
          <Text style={{ color: colors.text }}>取得方法: HealthKit API</Text>
        </View>

        {lastSyncTime && (
          <Text style={[styles.syncTime, { color: colors.text }]}>
            最終確認: {format(lastSyncTime, 'yyyy/MM/dd HH:mm', { locale: ja })}
          </Text>
        )}
      </View>

      <View style={[styles.dataCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>現在のデータ状況</Text>
        
        <View style={styles.dataRow}>
          <Ionicons name="footsteps" size={24} color="#2196F3" />
          <Text style={[styles.dataLabel, { color: colors.text }]}>今日の歩数:</Text>
          <Text style={[styles.dataValue, { color: colors.text }]}>
            {optimizedHealth.loading ? '取得中...' : `${optimizedHealth.steps.toLocaleString()} 歩`}
          </Text>
        </View>
        
        {optimizedHealth.sourceInfo && (
          <View style={styles.dataRow}>
            <Ionicons 
              name={optimizedHealth.hasMiBandData ? "star" : "cellular"} 
              size={24} 
              color={optimizedHealth.hasMiBandData ? "#FFD700" : "#4CAF50"} 
            />
            <Text style={[styles.dataLabel, { color: colors.text }]}>データソース:</Text>
            <Text style={[styles.dataValue, { color: colors.text }]}>
              {optimizedHealth.sourceInfo}
            </Text>
          </View>
        )}
        
        <View style={styles.dataRow}>
          <Ionicons name="sync" size={24} color="#FF9800" />
          <Text style={[styles.dataLabel, { color: colors.text }]}>Mi Band連携:</Text>
          <Text style={[styles.dataValue, { color: colors.text }]}>
            {optimizedHealth.hasMiBandData ? '✅ 検出済み' : '⚠️ 未検出'}
          </Text>
        </View>
      </View>

      {weeklyData && weeklyData.daily && weeklyData.daily.length > 0 && (
        <View style={[styles.weeklyCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>週間歩数履歴 (Mi Band優先)</Text>
          {weeklyData.daily.slice(0, 7).map((day: any, index: number) => (
            <View key={day.date} style={styles.weeklyRow}>
              <Text style={[styles.weeklyDate, { color: colors.text }]}>
                {format(new Date(day.date), 'MM/dd (E)', { locale: ja })}
              </Text>
              <Text style={[styles.weeklySteps, { color: colors.primary }]}>
                {day.steps.toLocaleString()} 歩
              </Text>
            </View>
          ))}
          <Text style={[styles.syncTime, { color: colors.text }]}>
            最終同期: {format(new Date(weeklyData.lastSyncTime), 'yyyy/MM/dd HH:mm', { locale: ja })}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#2196F3' }]}
          onPress={() => {
            Alert.alert(
              'HealthKit設定',
              'iOSの設定 → プライバシーとセキュリティ → ヘルスケア → データアクセスとデバイス → このアプリ から権限を確認してください。',
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons name="settings" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>HealthKit権限確認</Text>
        </TouchableOpacity>
      </View>


      <View style={[styles.helpCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>設定手順</Text>
        <Text style={{ color: colors.text, marginBottom: 8 }}>
          1. App StoreからZepp Lifeアプリをダウンロード
        </Text>
        <Text style={{ color: colors.text, marginBottom: 8 }}>
          2. Zepp LifeでMi Bandをペアリング・設定
        </Text>
        <Text style={{ color: colors.text, marginBottom: 8 }}>
          3. Zepp Life → プロフィール → 設定 → 「Apple Healthと同期」をON
        </Text>
        <Text style={{ color: colors.text, marginBottom: 8 }}>
          4. 本アプリでHealthKit権限を許可
        </Text>
        <Text style={{ color: colors.text, marginBottom: 8, fontSize: 12, fontStyle: 'italic' }}>
          ✅ 安全：公式API経由 | ✅ 自動同期：バックグラウンド対応 | ✅ 法的安全：利用規約準拠
        </Text>
        <Text style={{ color: colors.text, marginBottom: 8, fontSize: 12 }}>
          ※ 歩数データはダッシュボードのHealthKit統合で確認できます
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  deviceInfo: {
    marginTop: 8,
    marginBottom: 8,
  },
  syncTime: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 8,
  },
  dataCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dataLabel: {
    fontSize: 16,
    marginLeft: 8,
    width: 80,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectButton: {
    backgroundColor: '#2196F3',
  },
  syncButton: {
    backgroundColor: '#4CAF50',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  helpCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weeklyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  weeklyDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  weeklySteps: {
    fontSize: 16,
    fontWeight: '600',
  },
  // デバイス選択モーダルスタイル
  deviceSelectorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  deviceSelectorNote: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  deviceList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  deviceItemContent: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  deviceServices: {
    fontSize: 11,
    opacity: 0.6,
  },
  deviceManufacturer: {
    fontSize: 10,
    opacity: 0.5,
    fontFamily: 'monospace',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 12,
  },
  noDevicesText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    padding: 20,
  },
});

export default MiBandSetupScreen;
