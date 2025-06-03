import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from './ProgressBar';
import { UserGoal } from '../services/coachService';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface CoachGoalCardProps {
  goal: UserGoal;
  onComplete: (completed: boolean) => void;
  onPress?: () => void;
}

const goalTypeIcons = {
  walking: 'footsteps-outline',
  exercise: 'barbell-outline',
  stretching: 'body-outline',
  nutrition: 'nutrition-outline',
  sleep: 'moon-outline',
};

const CoachGoalCard: React.FC<CoachGoalCardProps> = ({ goal, onComplete, onPress }) => {
  const { colors } = useTheme();
  const [isCompleted, setIsCompleted] = useState(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // 今日が既に完了しているかチェック
  const completed = goal.completedDates?.includes(todayStr) || isCompleted;

  // 今日が予定日かをチェック
  const isScheduledToday = !goal.scheduledDays || goal.scheduledDays.includes(today.getDay());
  
  // 進捗率の計算
  const progress = goal.targetValue && goal.currentValue 
    ? Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100) 
    : completed ? 100 : 0;

  const handleToggleComplete = () => {
    const newCompletedState = !completed;
    setIsCompleted(newCompletedState);
    onComplete(newCompletedState);
  };

  // アイコンの取得
  const iconName = goalTypeIcons[goal.type as keyof typeof goalTypeIcons] || 'checkmark-circle-outline';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card },
        completed && { borderColor: '#4CAF50', borderWidth: 1 }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.iconAndTitle}>
          <Ionicons 
            name={iconName as any} 
            size={24} 
            color={completed ? '#4CAF50' : colors.text} 
            style={styles.icon} 
          />
          <Text style={[styles.title, { color: colors.text }]}>
            {goal.description}
          </Text>
        </View>
        {isScheduledToday && (
          <TouchableOpacity 
            style={[
              styles.completeButton,
              { backgroundColor: completed ? '#4CAF50' : colors.border }
            ]}
            onPress={handleToggleComplete}
          >
            <Ionicons 
              name={completed ? "checkmark" : "ellipse-outline"} 
              size={18} 
              color="#fff" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {goal.targetValue && (
        <View style={styles.progressSection}>
          <ProgressBar
            progress={progress}
            label=""
            current={goal.currentValue || 0}
            target={goal.targetValue}
            unit={goal.unit || ''}
            color={completed ? '#4CAF50' : undefined}
          />
        </View>
      )}
      
      <View style={styles.footer}>
        {goal.scheduledDays && (
          <View style={styles.scheduleDays}>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <View 
                key={day} 
                style={[
                  styles.dayDot,
                  { 
                    backgroundColor: goal.scheduledDays.includes(day) 
                      ? colors.primary 
                      : colors.border,
                    opacity: goal.scheduledDays.includes(day) ? 1 : 0.3,
                  }
                ]}
              >
                <Text style={[styles.dayText, { color: '#fff' }]}>
                  {['日', '月', '火', '水', '木', '金', '土'][day]}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {isScheduledToday && (
          <Text style={[styles.todayIndicator, { color: colors.primary }]}>
            今日の予定
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleDays: {
    flexDirection: 'row',
  },
  dayDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  todayIndicator: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default CoachGoalCard;
