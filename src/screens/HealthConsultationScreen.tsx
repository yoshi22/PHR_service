import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useCoachFeatures } from '../hooks/useCoachFeatures';
import CoachGoalCard from '../components/CoachGoalCard';
import WeeklyReviewPrompt from '../components/WeeklyReviewPrompt';
import DailyCheckInPrompt from '../components/DailyCheckInPrompt';
import EnhancedProgressDashboard from '../components/EnhancedProgressDashboard';
import SmartHabitTracker from '../components/SmartHabitTracker';
import AICoachingInsights from '../components/AICoachingInsights';
import EnhancedHealthMetrics from '../components/EnhancedHealthMetrics';

export type HealthConsultationStackParamList = {
  HealthConsultation: undefined;
  CreateGoal: undefined;
  GoalDetail: { goalId?: string };
  EditGoal: { goalId: string };
  GoalList: undefined;
  AIChat: { initialMessage?: string; systemInstruction?: string };
  ExerciseLibrary: undefined;
};

type ConsultationMode = 'coaching' | 'ai-chat';

const HealthConsultationScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
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

  const [activeMode, setActiveMode] = useState<ConsultationMode>('coaching');
  const [refreshing, setRefreshing] = useState(false);

  // データ読み込み
  useFocusEffect(
    useCallback(() => {
      loadUserGoals();
      loadTodayCheckin();
    }, [loadUserGoals, loadTodayCheckin])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadUserGoals(),
      loadTodayCheckin()
    ]);
    setRefreshing(false);
  }, [loadUserGoals, loadTodayCheckin]);

  const handleCreateGoal = () => {
    (navigation as any).navigate('CreateGoal');
  };

  const handleViewAllGoals = () => {
    (navigation as any).navigate('GoalList');
  };

  const handleGoalPress = (goalId: string) => {
    (navigation as any).navigate('GoalDetail', { goalId });
  };

  const handleAIChatPress = () => {
    (navigation as any).navigate('AIChat');
  };

  const renderModeSelector = () => (
    <View style={styles.modeSelectorContainer}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          activeMode === 'coaching' && { backgroundColor: colors.primary },
        ]}
        onPress={() => setActiveMode('coaching')}
      >
        <Ionicons
          name="fitness"
          size={20}
          color={activeMode === 'coaching' ? '#fff' : colors.text}
        />
        <Text
          style={[
            styles.modeButtonText,
            { color: activeMode === 'coaching' ? '#fff' : colors.text },
          ]}
        >
          運動コーチング
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modeButton,
          activeMode === 'ai-chat' && { backgroundColor: colors.primary },
        ]}
        onPress={() => setActiveMode('ai-chat')}
      >
        <Ionicons
          name="chatbubble-ellipses"
          size={20}
          color={activeMode === 'ai-chat' ? '#fff' : colors.text}
        />
        <Text
          style={[
            styles.modeButtonText,
            { color: activeMode === 'ai-chat' ? '#fff' : colors.text },
          ]}
        >
          AI健康相談
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCoachingContent = () => (
    <View style={styles.contentContainer}>
      {/* 目標カード */}
      <View style={styles.goalsSection}>
        <View style={styles.goalsSectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>今日の目標</Text>
          <TouchableOpacity onPress={handleViewAllGoals}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              すべて見る
            </Text>
          </TouchableOpacity>
        </View>

        {userGoals.length === 0 ? (
          <View style={[styles.emptyGoalsContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="trophy" size={48} color={colors.primary} style={styles.emptyIcon} />
            <Text style={[styles.emptyGoalsText, { color: colors.text }]}>
              目標を設定してコーチングを始めましょう
            </Text>
            <TouchableOpacity
              style={[styles.createGoalButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateGoal}
            >
              <Text style={styles.createGoalButtonText}>目標を作成</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.goalsList}>
            <Text style={[styles.goalsPlaceholder, { color: colors.text }]}>
              目標管理機能（開発中）
            </Text>
          </View>
        )}
      </View>

      {/* エクササイズライブラリへのリンク */}
      <TouchableOpacity
        style={[styles.exerciseLibraryButton, { backgroundColor: colors.card }]}
        onPress={() => (navigation as any).navigate('ExerciseLibrary')}
      >
        <Ionicons name="library" size={24} color={colors.primary} />
        <Text style={[styles.exerciseLibraryText, { color: colors.text }]}>
          エクササイズライブラリ
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderAIChatContent = () => (
    <View style={styles.contentContainer}>
      <View style={[styles.aiChatContainer, { backgroundColor: colors.card }]}>
        <View style={styles.aiChatHeader}>
          <Ionicons name="chatbubble-ellipses" size={32} color={colors.primary} />
          <Text style={[styles.aiChatTitle, { color: colors.text }]}>
            AI健康アシスタント
          </Text>
        </View>
        
        <Text style={[styles.aiChatDescription, { color: colors.text }]}>
          健康に関するどんな質問でもお気軽にどうぞ。栄養、運動、睡眠、メンタルヘルスなど、
          あなたの健康管理をサポートします。
        </Text>

        <TouchableOpacity
          style={[styles.startChatButton, { backgroundColor: colors.primary }]}
          onPress={handleAIChatPress}
        >
          <Ionicons name="chatbubbles" size={20} color="#fff" />
          <Text style={styles.startChatButtonText}>チャットを開始</Text>
        </TouchableOpacity>

        {/* クイックアクセス */}
        <View style={styles.quickAccessContainer}>
          <Text style={[styles.quickAccessTitle, { color: colors.text }]}>
            よくある相談
          </Text>
          
          <View style={styles.quickAccessGrid}>
            {[
              { icon: 'nutrition', text: '食事相談', message: '今日の食事について相談したいです' },
              { icon: 'bed', text: '睡眠改善', message: '睡眠の質を改善したいです' },
              { icon: 'heart', text: 'ストレス管理', message: 'ストレス管理について教えてください' },
              { icon: 'fitness', text: '運動計画', message: '効果的な運動計画を立てたいです' },
            ].map((item) => (
              <TouchableOpacity
                key={item.text}
                style={[styles.quickAccessItem, { backgroundColor: colors.background }]}
                onPress={() => (navigation as any).navigate('AIChat', { initialMessage: item.message })}
              >
                <Ionicons name={item.icon as any} size={24} color={colors.primary} />
                <Text style={[styles.quickAccessText, { color: colors.text }]}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>健康相談</Text>
      </View>

      {renderModeSelector()}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {activeMode === 'coaching' ? renderCoachingContent() : renderAIChatContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modeSelectorContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  // コーチング関連のスタイル
  goalsSection: {
    marginTop: 24,
  },
  goalsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyGoalsContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyGoalsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  createGoalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createGoalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  goalsList: {
    padding: 20,
    alignItems: 'center',
  },
  goalsPlaceholder: {
    fontSize: 14,
    opacity: 0.7,
  },
  exerciseLibraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  exerciseLibraryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  // AIチャット関連のスタイル
  aiChatContainer: {
    borderRadius: 12,
    padding: 20,
  },
  aiChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  aiChatTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  aiChatDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    opacity: 0.8,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  startChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickAccessContainer: {
    marginTop: 8,
  },
  quickAccessTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAccessItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  quickAccessText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default HealthConsultationScreen;
