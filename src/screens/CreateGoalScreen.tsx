import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCoachFeatures } from '../hooks/useCoachFeatures';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Timestamp } from 'firebase/firestore';

// 目標タイプの定義
const goalTypes = [
  { id: 'walking', label: 'ウォーキング', icon: 'footsteps-outline' },
  { id: 'exercise', label: '筋トレ', icon: 'barbell-outline' },
  { id: 'stretching', label: 'ストレッチ', icon: 'body-outline' },
  { id: 'nutrition', label: '食事', icon: 'nutrition-outline' },
  { id: 'sleep', label: '睡眠', icon: 'moon-outline' },
];

// 単位のマッピング
const unitMapping = {
  walking: '歩',
  exercise: '回',
  stretching: '分',
  nutrition: 'kcal',
  sleep: '時間',
};

const CreateGoalScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { createGoal } = useCoachFeatures();
  
  // フォーム状態
  const [selectedType, setSelectedType] = useState('walking');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('10000');
  const [hasTarget, setHasTarget] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // 曜日の選択を切り替える
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };
  
  // 目標の作成を処理
  const handleCreateGoal = async () => {
    // バリデーション
    if (!description.trim()) {
      Alert.alert('入力エラー', '目標の説明を入力してください。');
      return;
    }
    
    if (hasTarget && (!targetValue || isNaN(Number(targetValue)) || Number(targetValue) <= 0)) {
      Alert.alert('入力エラー', '有効な目標値を入力してください。');
      return;
    }
    
    if (selectedDays.length === 0) {
      Alert.alert('選択エラー', '少なくとも1つの曜日を選択してください。');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 目標オブジェクトの作成
      const newGoal = {
        type: selectedType,
        description: description.trim(),
        targetValue: hasTarget ? Number(targetValue) : undefined,
        currentValue: 0,
        unit: unitMapping[selectedType as keyof typeof unitMapping] || '',
        scheduledDays: selectedDays,
        active: true,
        startDate: Timestamp.fromDate(startDate),
        completedDates: [],
      };
      
      // 目標の保存
      const goalId = await createGoal(newGoal);
      
      if (goalId) {
        // 成功したら元の画面に戻る
        Alert.alert('成功', '新しい目標を作成しました。', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('エラー', '目標の作成に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('エラー', '目標の作成中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.text }]}>新しい目標</Text>
      
      {/* 目標タイプの選択 */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>目標タイプ</Text>
      <View style={styles.typeContainer}>
        {goalTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeButton,
              { borderColor: colors.border },
              selectedType === type.id && { 
                backgroundColor: colors.primary,
                borderColor: colors.primary
              }
            ]}
            onPress={() => setSelectedType(type.id)}
          >
            <Ionicons 
              name={type.icon as any} 
              size={24} 
              color={selectedType === type.id ? '#fff' : colors.text} 
            />
            <Text 
              style={[
                styles.typeText, 
                { color: selectedType === type.id ? '#fff' : colors.text }
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 目標説明 */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>説明</Text>
      <TextInput
        style={[
          styles.input, 
          { 
            backgroundColor: colors.card, 
            color: colors.text,
            borderColor: colors.border,
          }
        ]}
        placeholder="目標の説明（例：毎日1万歩歩く）"
        placeholderTextColor={colors.text + '80'}
        value={description}
        onChangeText={setDescription}
      />
      
      {/* 目標値 */}
      <View style={styles.targetHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>目標値</Text>
        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            数値目標を設定
          </Text>
          <Switch
            value={hasTarget}
            onValueChange={setHasTarget}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>
      
      {hasTarget && (
        <View style={styles.targetInputContainer}>
          <TextInput
            style={[
              styles.targetInput, 
              { 
                backgroundColor: colors.card, 
                color: colors.text,
                borderColor: colors.border,
              }
            ]}
            placeholder="目標値"
            placeholderTextColor={colors.text + '80'}
            value={targetValue}
            onChangeText={setTargetValue}
            keyboardType="numeric"
          />
          <Text style={[styles.unitText, { color: colors.text }]}>
            {unitMapping[selectedType as keyof typeof unitMapping] || ''}
          </Text>
        </View>
      )}
      
      {/* 予定日 */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>予定日</Text>
      <View style={styles.daysContainer}>
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              { borderColor: colors.border },
              selectedDays.includes(index) && { 
                backgroundColor: colors.primary,
                borderColor: colors.primary
              }
            ]}
            onPress={() => toggleDay(index)}
          >
            <Text 
              style={[
                styles.dayText, 
                { color: selectedDays.includes(index) ? '#fff' : colors.text }
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 開始日 */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>開始日</Text>
      <TouchableOpacity
        style={[
          styles.datePickerButton, 
          { 
            backgroundColor: colors.card, 
            borderColor: colors.border,
          }
        ]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.dateText, { color: colors.text }]}>
          {startDate.toLocaleDateString('ja-JP')}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.text} />
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}
      
      {/* 作成ボタン */}
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={handleCreateGoal}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>目標を作成</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  typeText: {
    marginLeft: 5,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  targetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  targetInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginRight: 10,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '600',
    width: 40,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  datePickerButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 30,
  },
  dateText: {
    fontSize: 16,
  },
  createButton: {
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CreateGoalScreen;
