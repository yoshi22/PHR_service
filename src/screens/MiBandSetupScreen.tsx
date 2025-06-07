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

const MiBandSetupScreen: React.FC = () => {
  const { colors } = useTheme();
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
    disconnect,
  } = useMiBand();

  const [refreshing, setRefreshing] = useState(false);

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
          Mi Bandと連携して健康データを記録しましょう
        </Text>
      </View>

      <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>接続状態</Text>
        <View style={styles.statusRow}>
          <Ionicons 
            name={isConnected ? "checkmark-circle" : "close-circle"} 
            size={24} 
            color={isConnected ? '#4CAF50' : '#F44336'} 
          />
          <Text style={[styles.statusText, { color: colors.text }]}>
            {isConnected ? '接続中' : '未接続'}
          </Text>
        </View>

        {device && (
          <View style={styles.deviceInfo}>
            <Text style={{ color: colors.text }}>デバイス: {device.name || 'Mi Band'}</Text>
            <Text style={{ color: colors.text }}>ID: {device.id.substring(0, 8)}...</Text>
          </View>
        )}

        {lastSyncTime && (
          <Text style={[styles.syncTime, { color: colors.text }]}>
            最終同期: {format(lastSyncTime, 'yyyy/MM/dd HH:mm', { locale: ja })}
          </Text>
        )}
      </View>

      <View style={[styles.dataCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>健康データ</Text>
        
        <View style={styles.dataRow}>
          <Ionicons name="heart" size={24} color="#F44336" />
          <Text style={[styles.dataLabel, { color: colors.text }]}>心拍数:</Text>
          <Text style={[styles.dataValue, { color: colors.text }]}>
            {heartRate ? `${heartRate} BPM` : '- BPM'}
          </Text>
        </View>
        
        <View style={styles.dataRow}>
          <Ionicons name="footsteps" size={24} color="#2196F3" />
          <Text style={[styles.dataLabel, { color: colors.text }]}>歩数:</Text>
          <Text style={[styles.dataValue, { color: colors.text }]}>
            {steps ? `${steps.toLocaleString()} 歩` : '- 歩'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {isConnected ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.syncButton, { backgroundColor: colors.primary }]}
              onPress={handleSync}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="sync" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>データを同期</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.disconnectButton]}
              onPress={handleDisconnect}
              disabled={refreshing}
            >
              <Ionicons name="bluetooth" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>切断</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.connectButton, { backgroundColor: colors.primary }]}
            onPress={handleConnect}
            disabled={isScanning || isConnecting}
          >
            {isScanning || isConnecting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="bluetooth" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>
                  {device ? '接続' : '検索して接続'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.helpCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>使い方</Text>
        <Text style={{ color: colors.text, marginBottom: 8 }}>
          1. Mi Bandを腕に装着し、Bluetoothをオンにします
        </Text>
        <Text style={{ color: colors.text, marginBottom: 8 }}>
          2. 「検索して接続」ボタンをタップしてMi Bandを接続します
        </Text>
        <Text style={{ color: colors.text }}>
          3. 「データを同期」ボタンをタップして健康データを同期します
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
});

export default MiBandSetupScreen;
