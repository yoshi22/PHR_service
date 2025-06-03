// filepath: /Users/muroiyousuke/Projects/phr-service/PHRApp/src/screens/GoalDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { useCoachFeatures } from '../hooks/useCoachFeatures';
import { UserGoal } from '../services/coachService';
import ProgressBar from '../components/ProgressBar';
import { format, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CoachStackParamList } from '../navigation/CoachNavigator';

// ナビゲーションのパラメータの型
type GoalDetailRouteParams = RouteProp<CoachStackParamList, 'GoalDetail'>;

// アイコンのマッピング
const goalTypeIcons = {
  walking: 'footsteps-outline',
  exercise: 'barbell-outline',
  stretching: 'body-outline',
  nutrition: 'nutrition-outline',
  sleep: 'moon-outline',
};

// タイプのラベル
const goalTypeLabels = {
  walking: 'ウォーキング',
  exercise: '筋トレ',
  stretching: 'ストレッチ',
  nutrition: '食事',
  sleep: '睡眠',
};

const GoalDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute<GoalDetailRouteParams>();
  const navigation = useNavigation<NavigationProp<CoachStackParamList>>();
  const { userGoals, toggleGoalCompletion, updateGoalProgress, loadUserGoals } = useCoachFeatures();
  
  // goalIdを取得
  const { goalId } = route.params;
  
  // 状態
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [progress, setProgress] = useState(0);
  const [currentValue, setCurrentValue] = useState('0');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // 目標データのロード
  useEffect(() => {
    const loadGoal = async () => {
      setIsLoading(true);
      try {
        // まず現在のuserGoalsから該当の目標を探す
        const foundGoal = userGoals.find(g => g.id === goalId);
        if (foundGoal) {
          setGoal(foundGoal);
          if (foundGoal.currentValue !== undefined && foundGoal.targetValue) {
            setCurrentValue(String(foundGoal.currentValue));
            setProgress(Math.min(Math.round((foundGoal.currentValue / foundGoal.targetValue) * 100), 100));
          }
        } else {
          // 見つからない場合は再読み込み
          await loadUserGoals();
          const refreshedGoal = userGoals.find(g => g.id === goalId);
          if (refreshedGoal) {
            setGoal(refreshedGoal);
            if (refreshedGoal.currentValue !== undefined && refreshedGoal.targetValue) {
              setCurrentValue(String(refreshedGoal.currentValue));
              setProgress(Math.min(Math.round((refreshedGoal.currentValue / refreshedGoal.targetValue) * 100), 100));
            }
          } else {
            Alert.alert('エラー', '目標が見つかりませんでした。');
            navigation.goBack();
          }
        }
      } catch (error) {
        console.error('Error loading goal details:', error);
        Alert.alert('エラー', '目標の読み込み中にエラーが発生しました。');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGoal();
  }, [goalId, userGoals, loadUserGoals, navigation]);
  
  // 進捗の更新
  const handleUpdateProgress = async () => {
    if (!goal || isUpdating) return;
    
    const newValue = Number(currentValue);
    if (isNaN(newValue) || newValue < 0) {
      Alert.alert('入力エラー', '有効な値を入力してください。');
      return;
    }
    
    setIsUpdating(true);
    try {
      const success = await updateGoalProgress(goalId, newValue);
      if (success) {
        if (goal.targetValue) {
          setProgress(Math.min(Math.round((newValue / goal.targetValue) * 100), 100));
        }
        Alert.alert('成功', '進捗を更新しました。');
      } else {
        Alert.alert('エラー', '進捗の更新に失敗しました。');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert('エラー', '進捗の更新中にエラーが発生しました。');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // 完了状態の切り替え
  const handleToggleCompletion = async (completed: boolean) => {
    if (!goal) return;
    
    try {
      await toggleGoalCompletion(goalId, completed);
    } catch (error) {
      console.error('Error toggling completion:', error);
      Alert.alert('エラー', '完了状態の更新に失敗しました。');
    }
  };
  
  // 編集画面への遷移
  const handleEdit = () => {
    navigation.navigate('EditGoal', { goalId });
  };
  
  // 削除の処理
  const handleDelete = () => {
    Alert.alert(
      '目標の削除',
      'この目標を削除してもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除する', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Firestoreで非アクティブに設定（今回は簡易的に実装）
              const db = await import('firebase/firestore').then(module => module.getFirestore());
              const docRef = await import('firebase/firestore').then(module => module.doc(db, 'userGoals', goalId as string));
              await import('firebase/firestore').then(module => module.updateDoc(docRef, {
                active: false
              }));
              
              Alert.alert('成功', '目標を削除しました。', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('エラー', '目標の削除に失敗しました。');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  if (!goal) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          目標が見つかりませんでした。
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // 今日が予定日かどうかをチェック
  const isScheduledToday = !goal.scheduledDays || goal.scheduledDays.includes(new Date().getDay());
  
  // 今日が既に完了しているかをチェック
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isCompletedToday = goal.completedDates?.includes(todayStr);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.typeIconContainer}>
          <Ionicons 
            name={goalTypeIcons[goal.type as keyof typeof goalTypeIcons] || 'checkmark-circle-outline' as any}
            size={30}
            color={colors.primary}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.typeLabel, { color: colors.text }]}>
            {goalTypeLabels[goal.type as keyof typeof goalTypeLabels] || '目標'}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {goal.description}
          </Text>
        </View>
      </View>
      
      {/* 進捗バー */}
      {goal.targetValue && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>進捗状況</Text>
          <ProgressBar
            progress={progress}
            label=""
            current={Number(currentValue)}
            target={goal.targetValue}
            unit={goal.unit || ''}
          />
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.progressInput, 
                { backgroundColor: colors.background, color: colors.text }
              ]}
              value={currentValue}
              onChangeText={setCurrentValue}
              keyboardType="numeric"
            />
            <Text style={[styles.unitText, { color: colors.text }]}>
              {goal.unit || ''}
            </Text>
            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdateProgress}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.updateButtonText}>更新</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* 今日の状態 */}
      {isScheduledToday && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>今日の状態</Text>
          
          <View style={styles.completionContainer}>
            <Text style={[styles.completionText, { color: colors.text }]}>
              {isCompletedToday ? '✅ 今日は完了しています' : '⏳ まだ完了していません'}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.completionButton,
                { backgroundColor: isCompletedToday ? '#4CAF50' : colors.primary }
              ]}
              onPress={() => handleToggleCompletion(!isCompletedToday)}
            >
              <Text style={styles.completionButtonText}>
                {isCompletedToday ? '完了を取り消す' : '完了にする'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* 予定日 */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>予定日</Text>
        
        <View style={styles.daysContainer}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <View
              key={index}
              style={[
                styles.dayIndicator,
                { borderColor: colors.border },
                goal.scheduledDays?.includes(index) && { 
                  backgroundColor: colors.primary,
                  borderColor: colors.primary
                }
              ]}
            >
              <Text 
                style={[
                  styles.dayText, 
                  { color: goal.scheduledDays?.includes(index) ? '#fff' : colors.text }
                ]}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* 開始日 */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>詳細情報</Text>
        
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.text }]}>開始日:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {goal.startDate ? format(new Date(goal.startDate), 'yyyy年MM月dd日', { locale: ja }) : '設定なし'}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.text }]}>目標タイプ:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {goalTypeLabels[goal.type as keyof typeof goalTypeLabels] || goal.type}
          </Text>
        </View>
        
        {goal.targetValue !== undefined && (
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.text }]}>目標値:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {goal.targetValue} {goal.unit || ''}
            </Text>
          </View>
        )}
      </View>
      
      {/* アクションボタン */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.card }]}
          onPress={handleEdit}
        >
          <Ionicons name="pencil" size={20} color={colors.primary} />
          <Text style={[styles.editButtonText, { color: colors.primary }]}>
            編集
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.card }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={20} color="#F44336" />
          <Text style={[styles.deleteButtonText, { color: '#F44336' }]}>
            削除
          </Text>
        </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  typeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    marginRight: 15,
  },
  titleContainer: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginRight: 8,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
  },
  updateButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  completionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  completionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  completionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginRight: 8,
    width: 80,
  },
  detailValue: {
    fontSize: 15,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 30,
  },
  editButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default GoalDetailScreen;
