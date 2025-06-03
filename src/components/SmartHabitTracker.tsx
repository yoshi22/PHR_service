import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetDays: number[];
  streak: number;
  completions: Date[];
  reminders: boolean;
  reminderTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'health' | 'fitness' | 'mindfulness' | 'nutrition' | 'other';
}

interface SmartHabitTrackerProps {
  theme: any;
}

const SmartHabitTracker: React.FC<SmartHabitTrackerProps> = ({ theme }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('smart_habits');
      if (storedHabits) {
        setHabits(JSON.parse(storedHabits));
      } else {
        // 初期のおすすめ習慣
        const defaultHabits: Habit[] = [
          {
            id: '1',
            name: '水を8杯飲む',
            description: '1日に2リットルの水を飲む',
            icon: 'water',
            color: '#2196F3',
            frequency: 'daily',
            targetDays: [1, 2, 3, 4, 5, 6, 7],
            streak: 0,
            completions: [],
            reminders: true,
            reminderTime: '09:00',
            difficulty: 'easy',
            category: 'health',
          },
          {
            id: '2',
            name: '30分運動',
            description: '有酸素運動または筋トレを30分',
            icon: 'fitness',
            color: '#FF5722',
            frequency: 'daily',
            targetDays: [1, 2, 3, 4, 5],
            streak: 0,
            completions: [],
            reminders: true,
            reminderTime: '18:00',
            difficulty: 'medium',
            category: 'fitness',
          },
          {
            id: '3',
            name: '瞑想',
            description: '10分間のマインドフルネス瞑想',
            icon: 'leaf',
            color: '#4CAF50',
            frequency: 'daily',
            targetDays: [1, 2, 3, 4, 5, 6, 7],
            streak: 0,
            completions: [],
            reminders: true,
            reminderTime: '07:00',
            difficulty: 'easy',
            category: 'mindfulness',
          },
        ];
        setHabits(defaultHabits);
        await AsyncStorage.setItem('smart_habits', JSON.stringify(defaultHabits));
      }
    } catch (error) {
      console.error('習慣の読み込みエラー:', error);
    }
  };

  const saveHabits = async (updatedHabits: Habit[]) => {
    try {
      await AsyncStorage.setItem('smart_habits', JSON.stringify(updatedHabits));
      setHabits(updatedHabits);
    } catch (error) {
      console.error('習慣の保存エラー:', error);
    }
  };

  const toggleHabitCompletion = async (habitId: string) => {
    const today = new Date();
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const isCompleted = habit.completions.some(completion =>
          isSameDay(new Date(completion), today)
        );

        if (isCompleted) {
          // 完了を取り消し
          return {
            ...habit,
            completions: habit.completions.filter(completion =>
              !isSameDay(new Date(completion), today)
            ),
            streak: Math.max(0, habit.streak - 1),
          };
        } else {
          // 完了をマーク
          return {
            ...habit,
            completions: [...habit.completions, today],
            streak: habit.streak + 1,
          };
        }
      }
      return habit;
    });

    await saveHabits(updatedHabits);
  };

  const getWeekDays = () => {
    const startOfCurrentWeek = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));
  };

  const isHabitCompletedOnDay = (habit: Habit, day: Date) => {
    return habit.completions.some(completion =>
      isSameDay(new Date(completion), day)
    );
  };

  const getHabitStats = (habit: Habit) => {
    const weekDays = getWeekDays();
    const completedThisWeek = weekDays.filter(day =>
      isHabitCompletedOnDay(habit, day)
    ).length;
    const targetThisWeek = habit.targetDays.length;
    const completionRate = (completedThisWeek / targetThisWeek) * 100;

    return {
      completedThisWeek,
      targetThisWeek,
      completionRate: Math.round(completionRate),
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderHabitCard = (habit: Habit) => {
    const stats = getHabitStats(habit);
    const today = new Date();
    const isCompletedToday = isHabitCompletedOnDay(habit, today);

    return (
      <View key={habit.id} style={[styles.habitCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.habitHeader}>
          <View style={styles.habitInfo}>
            <View style={[styles.habitIcon, { backgroundColor: habit.color }]}>
              <Ionicons name={habit.icon as any} size={24} color="#fff" />
            </View>
            <View style={styles.habitText}>
              <Text style={[styles.habitName, { color: theme.colors.text }]}>
                {habit.name}
              </Text>
              <Text style={[styles.habitDescription, { color: theme.colors.text, opacity: 0.7 }]}>
                {habit.description}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.checkButton,
              {
                backgroundColor: isCompletedToday ? habit.color : 'transparent',
                borderColor: habit.color,
              }
            ]}
            onPress={() => toggleHabitCompletion(habit.id)}
          >
            {isCompletedToday && (
              <Ionicons name="checkmark" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* 週間進捗 */}
        <View style={styles.weekProgress}>
          {getWeekDays().map((day, index) => (
            <View key={index} style={styles.dayContainer}>
              <Text style={[styles.dayLabel, { color: theme.colors.text }]}>
                {format(day, 'E')}
              </Text>
              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor: isHabitCompletedOnDay(habit, day)
                      ? habit.color
                      : theme.colors.border,
                  }
                ]}
              >
                {isHabitCompletedOnDay(habit, day) && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </View>
            </View>
          ))}
        </View>

        {/* 統計情報 */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: habit.color }]}>
              {habit.streak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              連続日数
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: habit.color }]}>
              {stats.completionRate}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              今週達成率
            </Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(habit.difficulty) }]}>
              <Text style={styles.difficultyText}>
                {habit.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          スマート習慣トラッカー
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text, opacity: 0.7 }]}>
          小さな習慣から大きな変化を
        </Text>
      </View>

      {habits.map(renderHabitCard)}

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          Alert.alert('新しい習慣', '新しい習慣を追加する機能は準備中です');
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>新しい習慣を追加</Text>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  habitCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  habitText: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default SmartHabitTracker;
