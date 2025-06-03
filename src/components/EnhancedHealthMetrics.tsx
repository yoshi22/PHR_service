import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays, startOfDay } from 'date-fns';

interface HealthMetric {
  id: string;
  name: string;
  unit: string;
  icon: string;
  color: string;
  value: number;
  targetMin?: number;
  targetMax?: number;
  trend: 'up' | 'down' | 'stable';
  category: 'vital' | 'activity' | 'wellness';
  lastUpdated: Date;
}

interface HealthMetricsData {
  timestamp: Date;
  heartRate: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  bodyTemperature: number;
  oxygenSaturation: number;
  weight: number;
  bmi: number;
  bodyFat: number;
  steps: number;
  caloriesBurned: number;
  sleepHours: number;
  stressLevel: number;
  hydration: number;
}

interface EnhancedHealthMetricsProps {
  theme: any;
}

const screenWidth = Dimensions.get('window').width;

const EnhancedHealthMetrics: React.FC<EnhancedHealthMetricsProps> = ({ theme }) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('heartRate');
  const [metricsData, setMetricsData] = useState<HealthMetricsData[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<HealthMetric[]>([]);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      // サンプルデータ（実際のアプリでは実際のヘルスデータを使用）
      const sampleData = generateSampleData();
      setMetricsData(sampleData);
      setCurrentMetrics(calculateCurrentMetrics(sampleData));
    } catch (error) {
      console.error('健康データの読み込みエラー:', error);
    }
  };

  const generateSampleData = (): HealthMetricsData[] => {
    const data: HealthMetricsData[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      data.push({
        timestamp: date,
        heartRate: 65 + Math.random() * 20,
        bloodPressureSys: 115 + Math.random() * 20,
        bloodPressureDia: 75 + Math.random() * 15,
        bodyTemperature: 36.2 + Math.random() * 0.8,
        oxygenSaturation: 97 + Math.random() * 3,
        weight: 70 + Math.random() * 2,
        bmi: 22 + Math.random() * 2,
        bodyFat: 15 + Math.random() * 5,
        steps: 5000 + Math.random() * 8000,
        caloriesBurned: 1800 + Math.random() * 800,
        sleepHours: 6 + Math.random() * 3,
        stressLevel: Math.random() * 10,
        hydration: 6 + Math.random() * 4,
      });
    }
    return data;
  };

  const calculateCurrentMetrics = (data: HealthMetricsData[]): HealthMetric[] => {
    if (data.length === 0) return [];

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];

    const getTrend = (current: number, prev: number): 'up' | 'down' | 'stable' => {
      const diff = ((current - prev) / prev) * 100;
      if (diff > 5) return 'up';
      if (diff < -5) return 'down';
      return 'stable';
    };

    return [
      {
        id: 'heartRate',
        name: '心拍数',
        unit: 'bpm',
        icon: 'heart',
        color: '#E91E63',
        value: Math.round(latest.heartRate),
        targetMin: 60,
        targetMax: 100,
        trend: getTrend(latest.heartRate, previous?.heartRate || latest.heartRate),
        category: 'vital',
        lastUpdated: latest.timestamp,
      },
      {
        id: 'bloodPressure',
        name: '血圧',
        unit: 'mmHg',
        icon: 'medical',
        color: '#F44336',
        value: Math.round(latest.bloodPressureSys),
        targetMin: 90,
        targetMax: 140,
        trend: getTrend(latest.bloodPressureSys, previous?.bloodPressureSys || latest.bloodPressureSys),
        category: 'vital',
        lastUpdated: latest.timestamp,
      },
      {
        id: 'oxygenSaturation',
        name: '血中酸素',
        unit: '%',
        icon: 'water',
        color: '#2196F3',
        value: Math.round(latest.oxygenSaturation),
        targetMin: 95,
        targetMax: 100,
        trend: getTrend(latest.oxygenSaturation, previous?.oxygenSaturation || latest.oxygenSaturation),
        category: 'vital',
        lastUpdated: latest.timestamp,
      },
      {
        id: 'bodyTemperature',
        name: '体温',
        unit: '°C',
        icon: 'thermometer',
        color: '#FF5722',
        value: Math.round(latest.bodyTemperature * 10) / 10,
        targetMin: 36.0,
        targetMax: 37.5,
        trend: getTrend(latest.bodyTemperature, previous?.bodyTemperature || latest.bodyTemperature),
        category: 'vital',
        lastUpdated: latest.timestamp,
      },
      {
        id: 'steps',
        name: '歩数',
        unit: '歩',
        icon: 'walk',
        color: '#4CAF50',
        value: Math.round(latest.steps),
        targetMin: 8000,
        trend: getTrend(latest.steps, previous?.steps || latest.steps),
        category: 'activity',
        lastUpdated: latest.timestamp,
      },
      {
        id: 'weight',
        name: '体重',
        unit: 'kg',
        icon: 'scale',
        color: '#9C27B0',
        value: Math.round(latest.weight * 10) / 10,
        trend: getTrend(latest.weight, previous?.weight || latest.weight),
        category: 'wellness',
        lastUpdated: latest.timestamp,
      },
      {
        id: 'sleepHours',
        name: '睡眠時間',
        unit: '時間',
        icon: 'bed',
        color: '#673AB7',
        value: Math.round(latest.sleepHours * 10) / 10,
        targetMin: 7,
        targetMax: 9,
        trend: getTrend(latest.sleepHours, previous?.sleepHours || latest.sleepHours),
        category: 'wellness',
        lastUpdated: latest.timestamp,
      },
      {
        id: 'stressLevel',
        name: 'ストレス',
        unit: '/10',
        icon: 'pulse',
        color: '#FF9800',
        value: Math.round(latest.stressLevel * 10) / 10,
        targetMax: 5,
        trend: getTrend(latest.stressLevel, previous?.stressLevel || latest.stressLevel),
        category: 'wellness',
        lastUpdated: latest.timestamp,
      },
    ];
  };

  const getChartData = (metricId: string) => {
    const last7Days = metricsData.slice(-7);
    const values = last7Days.map(data => {
      switch (metricId) {
        case 'heartRate': return data.heartRate;
        case 'bloodPressure': return data.bloodPressureSys;
        case 'oxygenSaturation': return data.oxygenSaturation;
        case 'bodyTemperature': return data.bodyTemperature;
        case 'steps': return data.steps / 1000; // 千歩単位
        case 'weight': return data.weight;
        case 'sleepHours': return data.sleepHours;
        case 'stressLevel': return data.stressLevel;
        default: return 0;
      }
    });

    return {
      labels: last7Days.map(data => format(data.timestamp, 'MM/dd')),
      datasets: [{
        data: values,
        color: (opacity = 1) => {
          const metric = currentMetrics.find(m => m.id === metricId);
          return metric ? `${metric.color}${Math.round(opacity * 255).toString(16)}` : '#4285f4';
        },
        strokeWidth: 3,
      }],
    };
  };

  const isValueInRange = (metric: HealthMetric): boolean => {
    if (metric.targetMin && metric.value < metric.targetMin) return false;
    if (metric.targetMax && metric.value > metric.targetMax) return false;
    return true;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'remove';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string, isInRange: boolean) => {
    if (!isInRange) return '#F44336';
    switch (trend) {
      case 'up': return '#4CAF50';
      case 'down': return '#FF9800';
      case 'stable': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const categoryMetrics = {
    vital: currentMetrics.filter(m => m.category === 'vital'),
    activity: currentMetrics.filter(m => m.category === 'activity'),
    wellness: currentMetrics.filter(m => m.category === 'wellness'),
  };

  const chartConfig = {
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 1,
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

  const renderMetricCard = (metric: HealthMetric) => {
    const inRange = isValueInRange(metric);
    const trendColor = getTrendColor(metric.trend, inRange);

    return (
      <TouchableOpacity
        key={metric.id}
        style={[
          styles.metricCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: selectedMetric === metric.id ? metric.color : 'transparent',
          }
        ]}
        onPress={() => setSelectedMetric(metric.id)}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: metric.color }]}>
            <Ionicons name={metric.icon as any} size={20} color="#fff" />
          </View>
          <View style={styles.metricInfo}>
            <Text style={[styles.metricName, { color: theme.colors.text }]}>
              {metric.name}
            </Text>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>
              {metric.value} {metric.unit}
            </Text>
          </View>
          <View style={styles.metricTrend}>
            <Ionicons
              name={getTrendIcon(metric.trend)}
              size={16}
              color={trendColor}
            />
          </View>
        </View>

        {metric.targetMin || metric.targetMax ? (
          <View style={styles.targetRange}>
            <Text style={[styles.targetText, { color: theme.colors.text }]}>
              目標: {metric.targetMin && `${metric.targetMin}${metric.unit}以上`}
              {metric.targetMin && metric.targetMax && ' '}
              {metric.targetMax && `${metric.targetMax}${metric.unit}以下`}
            </Text>
            <View
              style={[
                styles.rangeIndicator,
                { backgroundColor: inRange ? '#4CAF50' : '#F44336' }
              ]}
            />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderCategorySection = (title: string, metrics: HealthMetric[]) => (
    <View key={title} style={styles.categorySection}>
      <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      <View style={styles.metricsGrid}>
        {metrics.map(renderMetricCard)}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          健康指標ダッシュボード
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Alert.alert('設定', '健康指標の設定機能は準備中です')}
        >
          <Ionicons name="settings" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* トレンドチャート */}
      {selectedMetric && metricsData.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            {currentMetrics.find(m => m.id === selectedMetric)?.name}の7日間トレンド
          </Text>
          <LineChart
            data={getChartData(selectedMetric)}
            width={screenWidth - 60}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* バイタルサイン */}
      {renderCategorySection('バイタルサイン', categoryMetrics.vital)}

      {/* 活動量 */}
      {renderCategorySection('活動量', categoryMetrics.activity)}

      {/* ウェルネス */}
      {renderCategorySection('ウェルネス', categoryMetrics.wellness)}

      {/* データ同期ボタン */}
      <TouchableOpacity
        style={[styles.syncButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          Alert.alert('データ同期', 'ヘルスデータの同期機能は準備中です');
        }}
      >
        <Ionicons name="sync" size={20} color="#fff" />
        <Text style={styles.syncButtonText}>ヘルスデータを同期</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  settingsButton: {
    padding: 8,
  },
  chartCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricTrend: {
    alignItems: 'center',
  },
  targetRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetText: {
    fontSize: 10,
    opacity: 0.7,
    flex: 1,
  },
  rangeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default EnhancedHealthMetrics;
