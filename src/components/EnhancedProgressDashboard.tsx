import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

interface ProgressData {
  dailySteps: number[];
  weeklyGoalCompletion: number;
  healthMetrics: {
    heartRate: number[];
    sleep: number[];
    water: number[];
  };
  streakDays: number;
  badges: string[];
}

interface EnhancedProgressDashboardProps {
  data: ProgressData;
  theme: any;
}

const screenWidth = Dimensions.get('window').width;

const EnhancedProgressDashboard: React.FC<EnhancedProgressDashboardProps> = ({
  data,
  theme,
}) => {
  const chartConfig = {
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#4285f4',
    },
  };

  const weeklyStepsData = {
    labels: ['月', '火', '水', '木', '金', '土', '日'],
    datasets: [
      {
        data: data.dailySteps.slice(-7),
        color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const goalCompletionData = [
    {
      name: '達成',
      population: data.weeklyGoalCompletion,
      color: '#4CAF50',
      legendFontColor: theme.colors.text,
      legendFontSize: 15,
    },
    {
      name: '未達成',
      population: 100 - data.weeklyGoalCompletion,
      color: '#E0E0E0',
      legendFontColor: theme.colors.text,
      legendFontSize: 15,
    },
  ];

  const healthMetricsData = {
    labels: ['心拍数', '睡眠', '水分'],
    datasets: [
      {
        data: [
          data.healthMetrics.heartRate[data.healthMetrics.heartRate.length - 1] || 0,
          data.healthMetrics.sleep[data.healthMetrics.sleep.length - 1] || 0,
          data.healthMetrics.water[data.healthMetrics.water.length - 1] || 0,
        ],
      },
    ],
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 今週の歩数トレンド */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          今週の歩数トレンド
        </Text>
        <LineChart
          data={weeklyStepsData}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* 目標達成率とストリーク */}
      <View style={styles.row}>
        <View style={[styles.smallCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            目標達成率
          </Text>
          <PieChart
            data={goalCompletionData}
            width={150}
            height={150}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        <View style={[styles.smallCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            連続記録
          </Text>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={40} color="#FF6B35" />
            <Text style={[styles.streakNumber, { color: theme.colors.text }]}>
              {data.streakDays}
            </Text>
            <Text style={[styles.streakLabel, { color: theme.colors.text }]}>
              日連続
            </Text>
          </View>
        </View>
      </View>

      {/* 健康指標バーチャート */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          今日の健康指標
        </Text>
        <BarChart
          data={healthMetricsData}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </View>

      {/* 獲得バッジ */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          獲得バッジ
        </Text>
        <View style={styles.badgesContainer}>
          {data.badges.map((badge, index) => (
            <View key={index} style={styles.badge}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={[styles.badgeText, { color: theme.colors.text }]}>
                {badge}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  smallCard: {
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  streakContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  streakLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  badge: {
    alignItems: 'center',
    margin: 8,
    minWidth: 80,
  },
  badgeText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default EnhancedProgressDashboard;
