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
  Platform,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useAppleWatch } from '../hooks/useAppleWatch';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface AppleWatchSetupScreenProps {}

const AppleWatchSetupScreen: React.FC<AppleWatchSetupScreenProps> = () => {
  const { colors } = useTheme();
  const {
    isConnected,
    isAuthorized,
    isLoading,
    error,
    healthData,
    lastSyncTime,
    requestPermissions,
    syncHealthData,
    getWorkouts,
    disconnect,
    refreshConnectionState,
    isSupported,
  } = useAppleWatch();

  const [refreshing, setRefreshing] = useState(false);
  const [workouts, setWorkouts] = useState<any[]>([]);

  // 初期化時に接続状態を確認
  useEffect(() => {
    refreshConnectionState();
  }, [refreshConnectionState]);

  // 権限をリクエスト
  const handleRequestPermissions = useCallback(async () => {
    const granted = await requestPermissions();
    if (granted) {
      Alert.alert('成功', 'Apple Watchとの連携が設定されました！');
      await syncHealthData();
    }
  }, [requestPermissions, syncHealthData]);

  // データの同期
  const handleSync = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncHealthData();
      
      // 今日のワークアウトも取得
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const workoutData = await getWorkouts(startOfDay, today);
      setWorkouts(workoutData);
      
      Alert.alert('同期完了', 'Apple Watchからデータを同期しました');
    } catch (err) {
      Alert.alert('エラー', 'データの同期に失敗しました');
    } finally {
      setRefreshing(false);
    }
  }, [syncHealthData, getWorkouts]);

  // 接続を切断
  const handleDisconnect = useCallback(() => {
    Alert.alert(
      '接続を切断',
      'Apple Watchとの連携を切断しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '切断',
          style: 'destructive',
          onPress: async () => {
            await disconnect();
            Alert.alert('切断完了', 'Apple Watchとの連携を切断しました');
          },
        },
      ]
    );
  }, [disconnect]);

  // iOS以外の場合の表示
  if (!isSupported) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.unsupportedContainer}>
          <Ionicons name="phone-portrait-outline" size={64} color={colors.text} />
          <Text style={[styles.unsupportedTitle, { color: colors.text }]}>
            Apple Watch連携
          </Text>
          <Text style={[styles.unsupportedMessage, { color: colors.text }]}>
            Apple Watch連携はiOSデバイスでのみ利用可能です。
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleSync} />
      }
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Ionicons name="watch" size={48} color="#007AFF" />
        <Text style={[styles.title, { color: colors.text }]}>
          Apple Watch
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          HealthKitとの連携
        </Text>
      </View>

      {/* エラー表示 */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: '#FFE6E6' }]}>
          <Ionicons name="alert-circle" size={24} color="#FF4444" />
          <Text style={[styles.errorText, { color: '#FF4444' }]}>
            {error}
          </Text>
        </View>
      )}

      {/* 接続状態 */}
      <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
        <View style={styles.statusHeader}>
          <Text style={[styles.statusTitle, { color: colors.text }]}>
            接続状態
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isConnected ? '#4CAF50' : '#FF9800' }
          ]}>
            <Text style={styles.statusBadgeText}>
              {isConnected ? '接続済み' : '未接続'}
            </Text>
          </View>
        </View>
        
        {lastSyncTime && (
          <Text style={[styles.lastSync, { color: colors.text }]}>
            最終同期: {format(lastSyncTime, 'MM/dd HH:mm', { locale: ja })}
          </Text>
        )}
      </View>

      {/* アクションボタン */}
      <View style={styles.actionsContainer}>
        {!isConnected ? (
          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: '#007AFF' }]}
            onPress={handleRequestPermissions}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="link" size={24} color="white" />
                <Text style={styles.connectButtonText}>
                  HealthKit権限を許可
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.connectedActions}>
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: '#4CAF50' }]}
              onPress={handleSync}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="sync" size={24} color="white" />
                  <Text style={styles.syncButtonText}>データを同期</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.disconnectButton, { backgroundColor: '#FF5252' }]}
              onPress={handleDisconnect}
              disabled={isLoading}
            >
              <Ionicons name="unlink" size={24} color="white" />
              <Text style={styles.disconnectButtonText}>連携を切断</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ヘルスデータ表示 */}
      {isConnected && healthData && (
        <View style={[styles.dataCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.dataTitle, { color: colors.text }]}>
            今日のデータ
          </Text>
          
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Ionicons name="footsteps" size={32} color="#2196F3" />
              <Text style={[styles.dataValue, { color: colors.text }]}>
                {healthData.steps.toLocaleString()}
              </Text>
              <Text style={[styles.dataLabel, { color: colors.text }]}>
                歩数
              </Text>
            </View>
            
            <View style={styles.dataItem}>
              <Ionicons name="heart" size={32} color="#F44336" />
              <Text style={[styles.dataValue, { color: colors.text }]}>
                {healthData.heartRate || '-'}
              </Text>
              <Text style={[styles.dataLabel, { color: colors.text }]}>
                心拍数
              </Text>
            </View>
            
            <View style={styles.dataItem}>
              <Ionicons name="flame" size={32} color="#FF9800" />
              <Text style={[styles.dataValue, { color: colors.text }]}>
                {healthData.calories}
              </Text>
              <Text style={[styles.dataLabel, { color: colors.text }]}>
                カロリー
              </Text>
            </View>
            
            <View style={styles.dataItem}>
              <Ionicons name="map" size={32} color="#4CAF50" />
              <Text style={[styles.dataValue, { color: colors.text }]}>
                {(healthData.distance / 1000).toFixed(1)}km
              </Text>
              <Text style={[styles.dataLabel, { color: colors.text }]}>
                距離
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ワークアウト履歴 */}
      {workouts.length > 0 && (
        <View style={[styles.workoutsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.workoutsTitle, { color: colors.text }]}>
            今日のワークアウト
          </Text>
          
          {workouts.map((workout, index) => (
            <View key={index} style={styles.workoutItem}>
              <View style={styles.workoutHeader}>
                <Ionicons name="fitness" size={24} color="#673AB7" />
                <Text style={[styles.workoutType, { color: colors.text }]}>
                  {workout.type}
                </Text>
              </View>
              <View style={styles.workoutDetails}>
                <Text style={[styles.workoutDetail, { color: colors.text }]}>
                  {workout.duration}分 • {workout.calories}kcal
                </Text>
                <Text style={[styles.workoutTime, { color: colors.text }]}>
                  {format(workout.startDate, 'HH:mm', { locale: ja })} - {format(workout.endDate, 'HH:mm', { locale: ja })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 設定情報 */}
      <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          Apple Watch連携について
        </Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          • HealthKitを通じて健康データを取得
        </Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          • 歩数、心拍数、カロリー、ワークアウトを同期
        </Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          • リアルタイムでデータを更新
        </Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          • プライバシーは完全に保護されます
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unsupportedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  unsupportedMessage: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  statusCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  lastSync: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
  },
  actionsContainer: {
    margin: 16,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectedActions: {
    gap: 12,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  dataCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dataItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  dataValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  dataLabel: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  workoutsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workoutsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  workoutItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  workoutDetails: {
    marginLeft: 32,
  },
  workoutDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  workoutTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  infoCard: {
    margin: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 6,
    opacity: 0.8,
  },
});

export default AppleWatchSetupScreen;
