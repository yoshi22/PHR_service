import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays, parseISO } from 'date-fns';

interface HealthData {
  steps: number;
  heartRate: number;
  sleep: number;
  water: number;
  exercise: number;
  mood: number;
}

interface CoachingInsight {
  id: string;
  type: 'achievement' | 'recommendation' | 'warning' | 'trend';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
  relatedMetric: string;
  timestamp: Date;
}

interface AICoachingInsightsProps {
  theme: any;
  healthData: HealthData[];
}

const AICoachingInsights: React.FC<AICoachingInsightsProps> = ({
  theme,
  healthData,
}) => {
  const [insights, setInsights] = useState<CoachingInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    generateInsights();
  }, [healthData]);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const generatedInsights = await analyzeHealthData(healthData);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('インサイト生成エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeHealthData = async (data: HealthData[]): Promise<CoachingInsight[]> => {
    const insights: CoachingInsight[] = [];

    if (data.length === 0) return insights;

    const recent7Days = data.slice(-7);
    const recent30Days = data.slice(-30);
    const today = data[data.length - 1];
    const yesterday = data[data.length - 2];

    // 歩数分析
    const avgSteps7Days = recent7Days.reduce((sum, d) => sum + d.steps, 0) / recent7Days.length;
    const avgSteps30Days = recent30Days.reduce((sum, d) => sum + d.steps, 0) / recent30Days.length;

    if (today.steps > avgSteps7Days * 1.2) {
      insights.push({
        id: 'steps_achievement',
        type: 'achievement',
        title: '素晴らしい活動量！',
        description: `今日は平均より${Math.round(((today.steps - avgSteps7Days) / avgSteps7Days) * 100)}%多く歩きました。この調子で頑張りましょう！`,
        actionable: false,
        priority: 'medium',
        icon: 'walk',
        color: '#4CAF50',
        relatedMetric: 'steps',
        timestamp: new Date(),
      });
    } else if (today.steps < avgSteps7Days * 0.7) {
      insights.push({
        id: 'steps_low',
        type: 'recommendation',
        title: '活動量を増やしましょう',
        description: '今日の歩数が少し少なめです。15分の散歩を追加してみませんか？',
        actionable: true,
        priority: 'medium',
        icon: 'trending-down',
        color: '#FF9800',
        relatedMetric: 'steps',
        timestamp: new Date(),
      });
    }

    // 睡眠分析
    const avgSleep7Days = recent7Days.reduce((sum, d) => sum + d.sleep, 0) / recent7Days.length;
    if (today.sleep < 6) {
      insights.push({
        id: 'sleep_warning',
        type: 'warning',
        title: '睡眠不足の注意',
        description: '睡眠時間が不足しています。7-8時間の睡眠を心がけましょう。',
        actionable: true,
        priority: 'high',
        icon: 'bed',
        color: '#F44336',
        relatedMetric: 'sleep',
        timestamp: new Date(),
      });
    } else if (today.sleep > avgSleep7Days + 1) {
      insights.push({
        id: 'sleep_good',
        type: 'achievement',
        title: '良質な睡眠！',
        description: '十分な睡眠が取れています。質の良い休息は健康の基本です。',
        actionable: false,
        priority: 'low',
        icon: 'moon',
        color: '#4CAF50',
        relatedMetric: 'sleep',
        timestamp: new Date(),
      });
    }

    // トレンド分析
    const stepsUpTrend = avgSteps7Days > avgSteps30Days * 1.1;
    if (stepsUpTrend) {
      insights.push({
        id: 'steps_trend_up',
        type: 'trend',
        title: '活動量の改善傾向',
        description: '過去1週間の活動量が向上しています。この調子で継続しましょう！',
        actionable: false,
        priority: 'medium',
        icon: 'trending-up',
        color: '#2196F3',
        relatedMetric: 'steps',
        timestamp: new Date(),
      });
    }

    // 水分摂取分析
    if (today.water < 6) {
      insights.push({
        id: 'water_low',
        type: 'recommendation',
        title: '水分補給を忘れずに',
        description: '今日の水分摂取量が少なめです。コップ2-3杯の水を追加で飲みましょう。',
        actionable: true,
        priority: 'medium',
        icon: 'water',
        color: '#03A9F4',
        relatedMetric: 'water',
        timestamp: new Date(),
      });
    }

    // 心拍数分析
    if (today.heartRate > 100) {
      insights.push({
        id: 'heartrate_high',
        type: 'warning',
        title: '心拍数が高めです',
        description: 'ストレス管理や深呼吸を心がけ、リラックスする時間を作りましょう。',
        actionable: true,
        priority: 'medium',
        icon: 'heart',
        color: '#E91E63',
        relatedMetric: 'heartRate',
        timestamp: new Date(),
      });
    }

    // 運動頻度分析
    const exerciseCount7Days = recent7Days.filter(d => d.exercise > 0).length;
    if (exerciseCount7Days >= 5) {
      insights.push({
        id: 'exercise_consistent',
        type: 'achievement',
        title: '一貫した運動習慣！',
        description: '今週は素晴らしい運動習慣を維持しています。継続は力なりです！',
        actionable: false,
        priority: 'medium',
        icon: 'fitness',
        color: '#FF5722',
        relatedMetric: 'exercise',
        timestamp: new Date(),
      });
    } else if (exerciseCount7Days < 2) {
      insights.push({
        id: 'exercise_needed',
        type: 'recommendation',
        title: '運動を始めましょう',
        description: '今週の運動が少なめです。軽いストレッチや散歩から始めてみませんか？',
        actionable: true,
        priority: 'medium',
        icon: 'fitness',
        color: '#FF9800',
        relatedMetric: 'exercise',
        timestamp: new Date(),
      });
    }

    // 優先度でソート
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement': return 'trophy';
      case 'recommendation': return 'bulb';
      case 'warning': return 'warning';
      case 'trend': return 'analytics';
      default: return 'information-circle';
    }
  };

  const getInsightBackgroundColor = (type: string) => {
    switch (type) {
      case 'achievement': return '#E8F5E8';
      case 'recommendation': return '#FFF3E0';
      case 'warning': return '#FFEBEE';
      case 'trend': return '#E3F2FD';
      default: return '#F5F5F5';
    }
  };

  const handleInsightAction = (insight: CoachingInsight) => {
    if (!insight.actionable) return;

    const actions: { [key: string]: () => void } = {
      steps_low: () => {
        Alert.alert(
          '散歩の提案',
          '15分の軽い散歩はいかがですか？近所を歩くだけでも効果的です。',
          [{ text: 'OK' }]
        );
      },
      sleep_warning: () => {
        Alert.alert(
          '睡眠改善のヒント',
          '就寝1時間前にはスクリーンを見るのを控え、リラックスできる環境を作りましょう。',
          [{ text: 'OK' }]
        );
      },
      water_low: () => {
        Alert.alert(
          '水分補給リマインダー',
          '今すぐコップ1杯の水を飲んで、1時間後にもう一度確認しましょう。',
          [{ text: 'OK' }]
        );
      },
      heartrate_high: () => {
        Alert.alert(
          'リラクゼーション',
          '深呼吸を5回行い、5分間の瞑想を試してみませんか？',
          [{ text: 'OK' }]
        );
      },
      exercise_needed: () => {
        Alert.alert(
          '運動の提案',
          '10分間のストレッチや軽いヨガから始めてみましょう。',
          [{ text: 'OK' }]
        );
      },
    };

    const action = actions[insight.id];
    if (action) {
      action();
    }
  };

  const renderInsight = (insight: CoachingInsight) => (
    <TouchableOpacity
      key={insight.id}
      style={[
        styles.insightCard,
        {
          backgroundColor: theme.colors.card,
          borderLeftColor: insight.color,
        }
      ]}
      onPress={() => handleInsightAction(insight)}
      disabled={!insight.actionable}
    >
      <View style={styles.insightHeader}>
        <View style={[styles.insightIconContainer, { backgroundColor: insight.color }]}>
          <Ionicons name={insight.icon as any} size={20} color="#fff" />
        </View>
        <View style={styles.insightContent}>
          <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
            {insight.title}
          </Text>
          <Text style={[styles.insightDescription, { color: theme.colors.text }]}>
            {insight.description}
          </Text>
        </View>
        {insight.actionable && (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          AIがあなたの健康データを分析中...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          AIコーチングインサイト
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            setRefreshing(true);
            generateInsights().finally(() => setRefreshing(false));
          }}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={theme.colors.primary}
            style={{ opacity: refreshing ? 0.5 : 1 }}
          />
        </TouchableOpacity>
      </View>

      {insights.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="analytics" size={48} color={theme.colors.text} style={{ opacity: 0.3 }} />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            十分なデータが蓄積されたらインサイトを表示します
          </Text>
        </View>
      ) : (
        insights.map(renderInsight)
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  insightCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
});

export default AICoachingInsights;
