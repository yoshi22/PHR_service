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
import { useFitbit } from '../hooks/useFitbit';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const FitbitSetupScreen: React.FC = () => {
  const { colors } = useTheme();
  const {
    isConnected,
    isAuthorized,
    isLoading,
    error,
    fitbitData,
    lastSyncTime,
    startAuthentication,
    syncFitbitData,
    disconnect,
    refreshConnectionState,
    getSleepSummary,
    getActivitySummary,
  } = useFitbit();

  const [refreshing, setRefreshing] = useState(false);

  // 初期化時に接続状態を確認
  useEffect(() => {
    refreshConnectionState();
  }, [refreshConnectionState]);

  // 認証を開始
  const handleAuthentication = useCallback(async () => {
    try {
      await startAuthentication();
      Alert.alert(
        'Fitbit認証',
        'ブラウザでFitbitにログインして、アプリへのアクセスを許可してください。'
      );
    } catch (err) {
      Alert.alert('エラー', 'Fitbit認証の開始に失敗しました');
    }
  }, [startAuthentication]);

  // データの同期
  const handleSync = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncFitbitData();
      Alert.alert('同期完了', 'Fitbitからデータを同期しました');
    } catch (err) {
      Alert.alert('エラー', 'データの同期に失敗しました');
    } finally {
      setRefreshing(false);
    }
  }, [syncFitbitData]);

  // 接続を切断
  const handleDisconnect = useCallback(() => {
    Alert.alert(
      '接続を切断',
      'Fitbitとの連携を切断しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '切断',
          style: 'destructive',
          onPress: async () => {
            await disconnect();
            Alert.alert('切断完了', 'Fitbitとの連携を切断しました');
          },
        },
      ]
    );
  }, [disconnect]);

  const sleepSummary = getSleepSummary();
  const activitySummary = getActivitySummary();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleSync} />
      }
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={[styles.fitbitIcon, { backgroundColor: '#00B0B9' }]}>
          <Text style={styles.fitbitIconText}>Fitbit</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Fitbit
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Web API連携
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
            style={[styles.connectButton, { backgroundColor: '#00B0B9' }]}
            onPress={handleAuthentication}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="link" size={24} color="white" />
                <Text style={styles.connectButtonText}>
                  Fitbitアカウントに接続
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

      {/* アクティビティデータ表示 */}
      {isConnected && activitySummary && (
        <View style={[styles.dataCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.dataTitle, { color: colors.text }]}>
            今日のアクティビティ
          </Text>
          
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Ionicons name="footsteps" size={32} color="#2196F3" />
              <Text style={[styles.dataValue, { color: colors.text }]}>
                {activitySummary.steps.toLocaleString()}
              </Text>
              <Text style={[styles.dataLabel, { color: colors.text }]}>
                歩数
              </Text>
            </View>
            
            <View style={styles.dataItem}>
              <Ionicons name="flame" size={32} color="#FF9800" />
              <Text style={[styles.dataValue, { color: colors.text }]}>
                {activitySummary.calories}
              </Text>
              <Text style={[styles.dataLabel, { color: colors.text }]}>
                カロリー
              </Text>
            </View>
            
            <View style={styles.dataItem}>
              <Ionicons name="map" size={32} color="#4CAF50" />
              <Text style={[styles.dataValue, { color: colors.text }]}>
                {(activitySummary.distance / 1000).toFixed(1)}km
              </Text>
              <Text style={[styles.dataLabel, { color: colors.text }]}>
                距離
              </Text>
            </View>
            
            <View style={styles.dataItem}>
              <Ionicons name="fitness" size={32} color="#673AB7" />
              <Text style={[styles.dataValue, { color: colors.text }]}>
                {activitySummary.activeMinutes}分
              </Text>
              <Text style={[styles.dataLabel, { color: colors.text }]}>
                アクティブ
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 心拍数データ */}
      {isConnected && fitbitData?.heartRate && (
        <View style={[styles.heartRateCard, { backgroundColor: colors.card }]}>
          <View style={styles.heartRateHeader}>
            <Ionicons name="heart" size={32} color="#F44336" />
            <Text style={[styles.heartRateTitle, { color: colors.text }]}>
              安静時心拍数
            </Text>
          </View>
          <Text style={[styles.heartRateValue, { color: colors.text }]}>
            {fitbitData.heartRate} bpm
          </Text>
        </View>
      )}

      {/* 睡眠データ表示 */}
      {isConnected && sleepSummary && (
        <View style={[styles.sleepCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sleepTitle, { color: colors.text }]}>
            昨夜の睡眠
          </Text>
          
          <View style={styles.sleepGrid}>
            <View style={styles.sleepItem}>
              <Ionicons name="bed" size={32} color="#9C27B0" />
              <Text style={[styles.sleepValue, { color: colors.text }]}>
                {sleepSummary.duration}
              </Text>
              <Text style={[styles.sleepLabel, { color: colors.text }]}>
                睡眠時間
              </Text>
            </View>
            
            <View style={styles.sleepItem}>
              <Ionicons name="stats-chart" size={32} color="#E91E63" />
              <Text style={[styles.sleepValue, { color: colors.text }]}>
                {sleepSummary.efficiency}
              </Text>
              <Text style={[styles.sleepLabel, { color: colors.text }]}>
                睡眠効率
              </Text>
            </View>
            
            <View style={styles.sleepItem}>
              <Ionicons 
                name={sleepSummary.quality === 'Good' ? 'happy' : sleepSummary.quality === 'Fair' ? 'sad' : 'sad'} 
                size={32} 
                color={sleepSummary.quality === 'Good' ? '#4CAF50' : sleepSummary.quality === 'Fair' ? '#FF9800' : '#F44336'} 
              />
              <Text style={[styles.sleepValue, { color: colors.text }]}>
                {sleepSummary.quality}
              </Text>
              <Text style={[styles.sleepLabel, { color: colors.text }]}>
                睡眠品質
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* アクティビティ履歴 */}
      {isConnected && fitbitData?.activities && fitbitData.activities.length > 0 && (
        <View style={[styles.activitiesCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.activitiesTitle, { color: colors.text }]}>
            今日のアクティビティ履歴
          </Text>
          
          {fitbitData.activities.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityHeader}>
                <Ionicons name="fitness" size={24} color="#FF5722" />
                <Text style={[styles.activityName, { color: colors.text }]}>
                  {activity.activityName}
                </Text>
              </View>
              <View style={styles.activityDetails}>
                <Text style={[styles.activityDetail, { color: colors.text }]}>
                  {activity.duration}分 • {activity.calories}kcal • {activity.steps}歩
                </Text>
                <Text style={[styles.activityTime, { color: colors.text }]}>
                  {format(activity.startTime, 'HH:mm', { locale: ja })}開始
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 設定情報 */}
      <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          Fitbit連携について
        </Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          • Fitbit Web APIを通じてデータを取得
        </Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          • 歩数、心拍数、睡眠、アクティビティを同期
        </Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          • OAuth認証で安全に接続
        </Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          • すべてのFitbitデバイスに対応
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  fitbitIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fitbitIconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  heartRateCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heartRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  heartRateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  heartRateValue: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sleepCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sleepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sleepGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sleepItem: {
    alignItems: 'center',
    flex: 1,
  },
  sleepValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  sleepLabel: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  activitiesCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activitiesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  activityItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  activityDetails: {
    marginLeft: 32,
  },
  activityDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityTime: {
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

export default FitbitSetupScreen;
