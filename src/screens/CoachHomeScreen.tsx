import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useCoachFeatures } from '../hooks/useCoachFeatures';
import { useMiBand } from '../hooks/useMiBand';
import { useAppleWatch } from '../hooks/useAppleWatch';
import { useFitbit } from '../hooks/useFitbit';
import { CoachStackParamList } from '../navigation/CoachNavigator';
import CoachGoalCard from '../components/CoachGoalCard';
import WeeklyReviewPrompt from '../components/WeeklyReviewPrompt';
import DailyCheckInPrompt from '../components/DailyCheckInPrompt';
import EnhancedProgressDashboard from '../components/EnhancedProgressDashboard';
import SmartHabitTracker from '../components/SmartHabitTracker';
import AICoachingInsights from '../components/AICoachingInsights';
import EnhancedHealthMetrics from '../components/EnhancedHealthMetrics';
import { format, isToday, isWeekend, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CoachHomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<CoachStackParamList>>();
  const { user } = useAuth();
  const {
    userGoals,
    isLoading,
    loadUserGoals,
    toggleGoalCompletion,
    prepareCoachingPrompt,
    todayCheckin,
    loadTodayCheckin
  } = useCoachFeatures();
  const {
    isConnected: miBandConnected,
    steps,
    heartRate,
    lastSyncTime,
  } = useMiBand();
  
  const {
    isConnected: appleWatchConnected,
    isAuthorized: appleWatchAuthorized,
    healthData: appleWatchData,
    lastSyncTime: appleWatchLastSync,
    isSupported: appleWatchSupported,
    syncHealthData: syncAppleWatchData,
  } = useAppleWatch();
  
  const {
    isConnected: fitbitConnected,
    isAuthorized: fitbitAuthorized,
    fitbitData,
    lastSyncTime: fitbitLastSync,
    syncFitbitData,
  } = useFitbit();

  const [refreshing, setRefreshing] = useState(false);
  const [showWeeklyPrompt, setShowWeeklyPrompt] = useState(false);
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [showMorningCheckIn, setShowMorningCheckIn] = useState(false);
  const [showEveningCheckIn, setShowEveningCheckIn] = useState(false);
  const [newGoalType, setNewGoalType] = useState('walking');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  
  // Enhanced features state
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'habits' | 'insights' | 'metrics'>('overview');
  const [sampleHealthData, setSampleHealthData] = useState<any[]>([]);

  // 今日の日付
  const today = new Date();
  const dayOfWeek = format(today, 'EEEE', { locale: ja });
  const formattedDate = format(today, 'yyyy年MM月dd日', { locale: ja });

  // 画面がフォーカスされたときにデータをリロード
  useFocusEffect(
    useCallback(() => {
      loadUserGoals();
      loadTodayCheckin();
      checkWeeklyPrompt();
      checkDailyCheckInStatus();
      generateSampleHealthData();
    }, [loadUserGoals, loadTodayCheckin])
  );

  // サンプル健康データを生成
  const generateSampleHealthData = useCallback(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        steps: Math.floor(5000 + Math.random() * 8000),
        heartRate: Math.floor(65 + Math.random() * 20),
        sleep: Math.floor(6 + Math.random() * 3),
        water: Math.floor(6 + Math.random() * 4),
        exercise: Math.floor(Math.random() * 2), // 0 or 1
        mood: Math.floor(Math.random() * 10) + 1,
      });
    }
    setSampleHealthData(data);
  }, []);

  // 週末のプロンプト表示をチェック
  const checkWeeklyPrompt = useCallback(async () => {
    if (isWeekend(new Date())) {
      try {
        // 今週既に表示したかチェック
        const lastPrompt = await AsyncStorage.getItem('lastWeeklyPrompt');
        if (lastPrompt) {
          const lastDate = new Date(lastPrompt);
          const today = new Date();
          
          // 違う週なら表示
          if (lastDate.getDay() !== today.getDay() || 
              lastDate.getMonth() !== today.getMonth() || 
              lastDate.getFullYear() !== today.getFullYear()) {
            setShowWeeklyPrompt(true);
          }
        } else {
          // まだ表示していなければ表示
          setShowWeeklyPrompt(true);
        }
      } catch (error) {
        console.error('Failed to check weekly prompt status:', error);
      }
    }
  }, []);

  // 毎日のチェックインステータスを確認
  const checkDailyCheckInStatus = useCallback(async () => {
    try {
      await loadTodayCheckin();
      const currentHour = new Date().getHours();
      
      // 朝の時間帯(6:00-10:00)で、まだ朝のチェックインが完了していない場合
      if (currentHour >= 6 && currentHour < 10 && 
          (!todayCheckin || !todayCheckin.morningPlan || !todayCheckin.morningPlan.completed)) {
        const lastMorningPrompt = await AsyncStorage.getItem('lastMorningCheckIn');
        if (!lastMorningPrompt || !isToday(new Date(lastMorningPrompt))) {
          setShowMorningCheckIn(true);
        }
      }
      
      // 夜の時間帯(19:00-23:00)で、まだ夜のチェックインが完了していない場合
      if (currentHour >= 19 && currentHour < 23 && 
          (!todayCheckin || !todayCheckin.eveningReflection || !todayCheckin.eveningReflection.completed)) {
        const lastEveningPrompt = await AsyncStorage.getItem('lastEveningCheckIn');
        if (!lastEveningPrompt || !isToday(new Date(lastEveningPrompt))) {
          setShowEveningCheckIn(true);
        }
      }
    } catch (error) {
      console.error('Failed to check daily check-in status:', error);
    }
  }, [todayCheckin, loadTodayCheckin]);

  // 週末プロンプトを閉じたときの処理
  const handleDismissWeeklyPrompt = useCallback(async () => {
    setShowWeeklyPrompt(false);
    try {
      // 最後に表示した日付を保存
      await AsyncStorage.setItem('lastWeeklyPrompt', new Date().toISOString());
    } catch (error) {
      console.error('Failed to save weekly prompt status:', error);
    }
  }, []);

  // 朝のチェックインを閉じたときの処理
  const handleDismissMorningCheckIn = useCallback(async () => {
    setShowMorningCheckIn(false);
    try {
      // 最後に表示した日付を保存
      await AsyncStorage.setItem('lastMorningCheckIn', new Date().toISOString());
    } catch (error) {
      console.error('Failed to save morning check-in status:', error);
    }
  }, []);

  // 夜のチェックインを閉じたときの処理
  const handleDismissEveningCheckIn = useCallback(async () => {
    setShowEveningCheckIn(false);
    try {
      // 最後に表示した日付を保存
      await AsyncStorage.setItem('lastEveningCheckIn', new Date().toISOString());
    } catch (error) {
      console.error('Failed to save evening check-in status:', error);
    }
  }, []);

  // プルリフレッシュ
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Load goals
    await loadUserGoals();
    
    // Refresh device connections and data
    const promises = [];
    
    // If Apple Watch is supported and connected, sync data
    if (appleWatchSupported && appleWatchConnected) {
      const syncAppleWatch = async () => {
        try {
          await syncAppleWatchData();
        } catch (error) {
          console.error('Error refreshing Apple Watch data:', error);
        }
      };
      promises.push(syncAppleWatch());
    }
    
    // If Fitbit is connected, sync data
    if (fitbitConnected) {
      const syncFitbit = async () => {
        try {
          await syncFitbitData();
        } catch (error) {
          console.error('Error refreshing Fitbit data:', error);
        }
      };
      promises.push(syncFitbit());
    }
    
    // Wait for all sync operations to complete
    if (promises.length > 0) {
      await Promise.all(promises);
    }
    
    setRefreshing(false);
  }, [loadUserGoals, appleWatchSupported, appleWatchConnected, fitbitConnected]);

  // 朝の計画を開始
  const startMorningPlan = useCallback(async () => {
    try {
      setShowMorningCheckIn(true);
    } catch (error) {
      console.error('Error starting morning plan:', error);
    }
  }, []);

  // 夕方の振り返りを開始
  const startEveningReflection = useCallback(async () => {
    try {
      setShowEveningCheckIn(true);
    } catch (error) {
      console.error('Error starting evening reflection:', error);
    }
  }, []);

  // 今日予定されている目標をフィルタリング
  const todayGoals = userGoals.filter(goal => {
    if (!goal.scheduledDays) return true;
    return goal.scheduledDays.includes(today.getDay());
  });

  // Mi Band 設定画面へ移動
  const navigateToMiBandSetup = useCallback(() => {
    navigation.navigate('MiBandSetup');
  }, [navigation]);

  // Apple Watch 設定画面へ移動
  const navigateToAppleWatchSetup = useCallback(() => {
    navigation.navigate('AppleWatchSetup');
  }, [navigation]);

  // Fitbit 設定画面へ移動
  const navigateToFitbitSetup = useCallback(() => {
    navigation.navigate('FitbitSetup');
  }, [navigation]);

  // エクササイズライブラリへ移動
  const navigateToExerciseLibrary = useCallback(() => {
    navigation.navigate('ExerciseLibrary');
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ヘッダー部分 */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              こんにちは、{user?.displayName || 'お客様'}
            </Text>
            <Text style={[styles.date, { color: colors.text }]}>
              {formattedDate}（{dayOfWeek}）
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('CoachSettings')}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Enhanced Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
            {[
              { key: 'overview', icon: 'home', label: 'ホーム' },
              { key: 'progress', icon: 'analytics', label: '進捗' },
              { key: 'habits', icon: 'checkmark-circle', label: '習慣' },
              { key: 'insights', icon: 'bulb', label: 'AI分析' },
              { key: 'metrics', icon: 'medical', label: '健康指標' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeTab === tab.key ? colors.primary : colors.card,
                  }
                ]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={activeTab === tab.key ? '#fff' : colors.text}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: activeTab === tab.key ? '#fff' : colors.text,
                    }
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* クイックアクション */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={startMorningPlan}
              >
                <Ionicons name="sunny-outline" size={20} color="#fff" />
                <Text style={styles.actionText}>朝の計画</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#8E24AA' }]}
                onPress={startEveningReflection}
              >
                <Ionicons name="moon-outline" size={20} color="#fff" />
                <Text style={styles.actionText}>夜の振り返り</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#26A69A' }]}
                onPress={() => setShowWeeklyPrompt(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#fff" />
                <Text style={styles.actionText}>週間レビュー</Text>
              </TouchableOpacity>
            </View>

            {/* 今日の目標セクション */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  今日の目標
                </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('GoalList')}
                  style={styles.seeAllButton}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    すべて見る
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
              ) : todayGoals.length > 0 ? (
                todayGoals.map((goal) => (
                  <CoachGoalCard 
                    key={goal.id}
                    goal={goal}
                    onComplete={(completed) => goal.id && toggleGoalCompletion(goal.id, completed)}
                    onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
                  />
                ))
              ) : (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    今日の目標はありません。新しい目標を設定しましょう。
                  </Text>
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('CreateGoal')}
                  >
                    <Text style={styles.addButtonText}>目標を追加</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* アドバイスセクション */}
            <View style={[styles.adviceCard, { backgroundColor: colors.card }]}>
              <View style={styles.adviceHeader}>
                <Ionicons name="bulb-outline" size={24} color="#FFC107" />
                <Text style={[styles.adviceTitle, { color: colors.text }]}>
                  今日のヒント
                </Text>
              </View>
              <Text style={[styles.adviceText, { color: colors.text }]}>
                デスクワークが続く場合は、1時間ごとに立ち上がって軽いストレッチをしましょう。血行促進と姿勢改善に効果的です。
              </Text>
            </View>

            {/* アクティビティトラッカー選択セクション */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  アクティビティトラッカー
                </Text>
              </View>
              
              {/* デバイス選択カード */}
              <View style={styles.deviceGrid}>
                {/* Mi Band */}
                <TouchableOpacity
                  style={[styles.deviceCard, { backgroundColor: colors.card }]}
                  onPress={navigateToMiBandSetup}
                >
                  <View style={styles.deviceHeader}>
                    <Ionicons name="watch-outline" size={32} color="#FF6B35" />
                    <Text style={[styles.deviceName, { color: colors.text }]}>
                      Mi Band
                    </Text>
                  </View>
                  <View style={[
                    styles.deviceStatus,
                    { backgroundColor: miBandConnected ? '#E8F5E8' : '#FFF3E0' }
                  ]}>
                    <Text style={[
                      styles.deviceStatusText,
                      { color: miBandConnected ? '#4CAF50' : '#FF9800' }
                    ]}>
                      {miBandConnected ? '接続済み' : '未接続'}
                    </Text>
                  </View>
                  {miBandConnected && (
                    <View style={styles.deviceStats}>
                      <Text style={[styles.deviceStatsText, { color: colors.text }]}>
                        {steps ? `${steps.toLocaleString()}歩` : '歩数: -'}
                      </Text>
                      <Text style={[styles.deviceStatsText, { color: colors.text }]}>
                        {heartRate ? `心拍: ${heartRate}bpm` : '心拍: -'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Apple Watch */}
                <TouchableOpacity
                  style={[styles.deviceCard, { backgroundColor: colors.card }]}
                  onPress={navigateToAppleWatchSetup}
                >
                  <View style={styles.deviceHeader}>
                    <Ionicons name="watch" size={32} color="#007AFF" />
                    <Text style={[styles.deviceName, { color: colors.text }]}>
                      Apple Watch
                    </Text>
                  </View>
                  <View style={[
                    styles.deviceStatus,
                    { backgroundColor: appleWatchConnected ? '#E8F5E8' : '#FFF3E0' }
                  ]}>
                    <Text style={[
                      styles.deviceStatusText,
                      { color: appleWatchConnected ? '#4CAF50' : '#FF9800' }
                    ]}>
                      {appleWatchConnected ? '接続済み' : (appleWatchSupported ? '未接続' : 'iOSのみ')}
                    </Text>
                  </View>
                  {appleWatchConnected && appleWatchData && (
                    <View style={styles.deviceStats}>
                      <Text style={[styles.deviceStatsText, { color: colors.text }]}>
                        {appleWatchData.steps ? `${appleWatchData.steps.toLocaleString()}歩` : '歩数: -'}
                      </Text>
                      {appleWatchData.heartRate > 0 && (
                        <Text style={[styles.deviceStatsText, { color: colors.text }]}>
                          {`心拍: ${appleWatchData.heartRate}bpm`}
                        </Text>
                      )}
                    </View>
                  )}
                  <Text style={[styles.deviceDescription, { color: colors.text }]}>
                    HealthKit連携
                  </Text>
                </TouchableOpacity>

                {/* Fitbit */}
                <TouchableOpacity
                  style={[styles.deviceCard, { backgroundColor: colors.card }]}
                  onPress={navigateToFitbitSetup}
                >
                  <View style={styles.deviceHeader}>
                    <View style={[styles.fitbitIcon, { backgroundColor: '#00B0B9' }]}>
                      <Text style={styles.fitbitIconText}>F</Text>
                    </View>
                    <Text style={[styles.deviceName, { color: colors.text }]}>
                      Fitbit
                    </Text>
                  </View>
                  <View style={[
                    styles.deviceStatus,
                    { backgroundColor: fitbitConnected ? '#E8F5E8' : '#FFF3E0' }
                  ]}>
                    <Text style={[
                      styles.deviceStatusText,
                      { color: fitbitConnected ? '#4CAF50' : '#FF9800' }
                    ]}>
                      {fitbitConnected ? '接続済み' : '未接続'}
                    </Text>
                  </View>
                  {fitbitConnected && fitbitData && (
                    <View style={styles.deviceStats}>
                      <Text style={[styles.deviceStatsText, { color: colors.text }]}>
                        {fitbitData.steps > 0 ? `${fitbitData.steps.toLocaleString()}歩` : '歩数: -'}
                      </Text>
                      {fitbitData.heartRate > 0 && (
                        <Text style={[styles.deviceStatsText, { color: colors.text }]}>
                          {`心拍: ${fitbitData.heartRate}bpm`}
                        </Text>
                      )}
                    </View>
                  )}
                  <Text style={[styles.deviceDescription, { color: colors.text }]}>
                    Web API連携
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* エクササイズライブラリ */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  エクササイズライブラリ
                </Text>
                <TouchableOpacity 
                  onPress={navigateToExerciseLibrary}
                  style={styles.seeAllButton}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    すべて見る
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.exerciseCard, { backgroundColor: colors.card }]}>
                <View style={styles.exerciseCardContent}>
                  <View style={styles.exerciseCardText}>
                    <Text style={[styles.exerciseCardTitle, { color: colors.text }]}>
                      エクササイズライブラリ
                    </Text>
                    <Text style={[styles.exerciseCardDescription, { color: colors.text }]}>
                      自分のレベルに合わせた効果的なエクササイズを見つけましょう
                    </Text>
                    <TouchableOpacity
                      style={[styles.exerciseCardButton, { backgroundColor: colors.primary }]}
                      onPress={navigateToExerciseLibrary}
                    >
                      <Text style={styles.exerciseCardButtonText}>ライブラリを開く</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.exerciseCardIconContainer}>
                    <Ionicons name="fitness" size={60} color={colors.primary} style={styles.exerciseCardIcon} />
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Enhanced Progress Tab */}
        {activeTab === 'progress' && (
          <EnhancedProgressDashboard
            data={{
              dailySteps: sampleHealthData.map(d => d.steps),
              weeklyGoalCompletion: 75,
              healthMetrics: {
                heartRate: sampleHealthData.map(d => d.heartRate),
                sleep: sampleHealthData.map(d => d.sleep),
                water: sampleHealthData.map(d => d.water),
              },
              streakDays: 5,
              badges: ['歩数達成', '睡眠良好', '水分補給'],
            }}
            theme={{ colors }}
          />
        )}

        {/* Smart Habits Tab */}
        {activeTab === 'habits' && (
          <SmartHabitTracker theme={{ colors }} />
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <AICoachingInsights
            theme={{ colors }}
            healthData={sampleHealthData}
          />
        )}

        {/* Enhanced Health Metrics Tab */}
        {activeTab === 'metrics' && (
          <EnhancedHealthMetrics theme={{ colors }} />
        )}

        {/* 週間レビュープロンプト */}
        {showWeeklyPrompt && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={showWeeklyPrompt}
          >
            <View style={styles.modalOverlay}>
              <WeeklyReviewPrompt onDismiss={handleDismissWeeklyPrompt} />
            </View>
          </Modal>
        )}

        {/* 朝のチェックインプロンプト */}
        {showMorningCheckIn && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={showMorningCheckIn}
          >
            <View style={styles.modalOverlay}>
              <DailyCheckInPrompt 
                type="morning"
                onDismiss={handleDismissMorningCheckIn} 
              />
            </View>
          </Modal>
        )}

        {/* 夜のチェックインプロンプト */}
        {showEveningCheckIn && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={showEveningCheckIn}
          >
            <View style={styles.modalOverlay}>
              <DailyCheckInPrompt 
                type="evening"
                onDismiss={handleDismissEveningCheckIn} 
              />
            </View>
          </Modal>
        )}



        {/* 新規目標作成ボタン */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateGoal')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    marginVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tabScrollView: {
    flexGrow: 0,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    width: '30%',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 5,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  seeAllButton: {
    padding: 5,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    padding: 20,
  },
  emptyState: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 15,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  adviceCard: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  adviceText: {
    lineHeight: 20,
  },
  // Mi Band スタイル
  miBandCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  miBandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  miBandConnected: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miBandConnectedText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  lastSyncText: {
    fontSize: 12,
    opacity: 0.7,
  },
  miBandStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  miBandStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  miBandStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  miBandStatLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  miBandStatDivider: {
    width: 1,
    height: 40,
    opacity: 0.2,
    backgroundColor: '#000',
  },
  miBandEmpty: {
    alignItems: 'center',
    padding: 16,
  },
  miBandImage: {
    width: 80,
    height: 80,
    marginBottom: 12,
    alignSelf: 'center',
  },
  miBandEmptyText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  miBandConnectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  miBandConnectText: {
    color: '#fff',
    fontWeight: '600',
  },
  // エクササイズライブラリスタイル
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  exerciseCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCardText: {
    flex: 1,
  },
  exerciseCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  exerciseCardDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
  },
  exerciseCardButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  exerciseCardButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  exerciseCardIconContainer: {
    marginLeft: 16,
  },
  exerciseCardIcon: {
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // Device Grid Styles
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  deviceCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  deviceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  deviceStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deviceDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  deviceStats: {
    marginTop: 8,
  },
  deviceStatsText: {
    fontSize: 12,
    marginBottom: 2,
    opacity: 0.8,
  },
  fitbitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fitbitIconText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CoachHomeScreen;
