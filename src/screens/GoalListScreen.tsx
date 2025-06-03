import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCoachFeatures } from '../hooks/useCoachFeatures';
import CoachGoalCard from '../components/CoachGoalCard';
import { UserGoal } from '../services/coachService';
import { CoachStackParamList } from '../navigation/CoachNavigator';

const GoalListScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<CoachStackParamList>>();
  const { userGoals, isLoading, loadUserGoals, toggleGoalCompletion } = useCoachFeatures();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [filteredGoals, setFilteredGoals] = useState<UserGoal[]>([]);
  
  // 画面がフォーカスされたときにデータをロード
  useFocusEffect(
    useCallback(() => {
      loadUserGoals();
    }, [loadUserGoals])
  );
  
  // 目標をフィルタリング
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'形式
    const todayDay = today.getDay(); // 0: 日曜, 1: 月曜, ..., 6: 土曜
    
    let filtered: UserGoal[];
    switch (activeFilter) {
      case 'scheduled':
        // 今日予定されている目標
        filtered = userGoals.filter(goal => 
          !goal.scheduledDays || goal.scheduledDays.includes(todayDay)
        );
        break;
      case 'completed':
        // 今日既に完了した目標
        filtered = userGoals.filter(goal => 
          goal.completedDates?.includes(todayStr)
        );
        break;
      case 'all':
      default:
        filtered = [...userGoals];
        break;
    }
    
    setFilteredGoals(filtered);
  }, [userGoals, activeFilter]);
  
  // プルリフレッシュ
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserGoals();
    setRefreshing(false);
  }, [loadUserGoals]);
  
  // 目標の詳細を表示
  const handleViewGoal = (goalId: string) => {
    navigation.navigate('GoalDetail', { goalId });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ヘッダー */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>目標リスト</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateGoal')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* フィルターボタン */}
      <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'all' && [styles.activeFilterButton, { borderColor: colors.primary }]
          ]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[
            styles.filterText,
            { color: activeFilter === 'all' ? colors.primary : colors.text }
          ]}>
            すべて
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'scheduled' && [styles.activeFilterButton, { borderColor: colors.primary }]
          ]}
          onPress={() => setActiveFilter('scheduled')}
        >
          <Text style={[
            styles.filterText,
            { color: activeFilter === 'scheduled' ? colors.primary : colors.text }
          ]}>
            今日の予定
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'completed' && [styles.activeFilterButton, { borderColor: colors.primary }]
          ]}
          onPress={() => setActiveFilter('completed')}
        >
          <Text style={[
            styles.filterText,
            { color: activeFilter === 'completed' ? colors.primary : colors.text }
          ]}>
            完了済み
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* 目標リスト */}
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredGoals}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={({ item }) => (
            <CoachGoalCard
              goal={item}
              onComplete={(completed) => item.id && toggleGoalCompletion(item.id, completed)}
              onPress={() => item.id && handleViewGoal(item.id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="clipboard-outline" size={50} color={colors.text + '50'} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {activeFilter === 'all' 
                  ? '目標がまだ設定されていません。\n新しい目標を追加しましょう。'
                  : activeFilter === 'scheduled'
                    ? '今日の予定はありません。\n新しい目標を追加するか、別の日に予定されている目標をチェックしましょう。'
                    : '今日完了した目標はまだありません。'}
              </Text>
              {activeFilter === 'all' && (
                <TouchableOpacity
                  style={[styles.emptyAddButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('CreateGoal')}
                >
                  <Ionicons name="add" size={20} color="#fff" style={styles.emptyAddIcon} />
                  <Text style={styles.emptyAddText}>目標を追加</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterButton: {
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 50, // 下部余白を追加
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    marginTop: 40,
    padding: 30,
    alignItems: 'center',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
    lineHeight: 22,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  emptyAddIcon: {
    marginRight: 8,
  },
  emptyAddText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default GoalListScreen;
