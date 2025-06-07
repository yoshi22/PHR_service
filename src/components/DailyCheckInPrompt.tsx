import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCoachFeatures } from '../hooks/useCoachFeatures';
import { CoachStackParamList } from '../navigation/CoachNavigator';

type NavigationProp = NativeStackNavigationProp<CoachStackParamList>;

interface DailyCheckInPromptProps {
  type?: 'morning' | 'evening';
  checkinType?: 'morning' | 'evening'; // For backward compatibility
  onDismiss?: () => void;
}

const DailyCheckInPrompt: React.FC<DailyCheckInPromptProps> = ({ type, checkinType, onDismiss }) => {
  // Use either type or checkinType, with type having priority
  const checkInType = type || checkinType || 'morning';
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { prepareCoachingPrompt, saveDailyCheckin, todayCheckin } = useCoachFeatures();
  const [isLoading, setIsLoading] = useState(false);
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');

  // 今日の日付を取得
  const today = new Date();
  const formattedDate = format(today, 'yyyy年MM月dd日 (EEEE)', { locale: ja });

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    const updatedGoals = [...goals];
    updatedGoals.splice(index, 1);
    setGoals(updatedGoals);
  };

  const handleStartChat = async () => {
    setIsLoading(true);
    try {
      // 朝のチェックインの場合は目標を保存
      if (checkInType === 'morning' && goals.length > 0) {
        await saveDailyCheckin({
          morningPlan: {
            goals: goals,
            completed: true
          }
        });
      }

      const promptType = checkInType === 'morning' ? 'morningPlan' : 'eveningReflection';
      const promptData = await prepareCoachingPrompt(promptType);
      
      if (promptData) {
        // ChatScreenに遷移してプロンプトを設定
        navigation.navigate('Chat', {
          initialMessage: promptData.userPrompt,
          systemInstruction: promptData.systemPrompt
        });
        if (onDismiss) {
          onDismiss();
        }
      }
    } catch (error) {
      console.error(`Error starting ${checkInType} check-in:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Ionicons 
          name={checkInType === 'morning' ? 'sunny' : 'moon'} 
          size={24} 
          color={checkInType === 'morning' ? '#FFA726' : '#7E57C2'} 
        />
        <Text style={[styles.title, { color: colors.text }]}>
          {checkInType === 'morning' ? '朝のチェックイン' : '夜のチェックイン'}
        </Text>
      </View>

      <Text style={[styles.date, { color: colors.text }]}>
        {formattedDate}
      </Text>

      <Text style={[styles.description, { color: colors.text }]}>
        {checkInType === 'morning' 
          ? '今日の小さな健康目標を設定しましょう。何を達成したいですか？'
          : '今日の活動を振り返りましょう。どのような成果がありましたか？'}
      </Text>
      
      {checkInType === 'morning' && (
        <View style={styles.goalInputContainer}>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={newGoal}
            onChangeText={setNewGoal}
            placeholder="今日の小さな目標を入力"
            placeholderTextColor={colors.text + '80'}
            returnKeyType="done"
            onSubmitEditing={addGoal}
          />
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]} 
            onPress={addGoal}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {checkInType === 'morning' && goals.length > 0 && (
        <ScrollView style={styles.goalsList} showsVerticalScrollIndicator={false}>
          {goals.map((goal, index) => (
            <View key={index} style={[styles.goalItem, { backgroundColor: colors.border + '30' }]}>
              <Text style={[styles.goalText, { color: colors.text }]} numberOfLines={2}>
                {goal}
              </Text>
              <TouchableOpacity onPress={() => removeGoal(index)}>
                <Ionicons name="close-circle" size={18} color={colors.text + '80'} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.laterButton, { borderColor: colors.border }]}
          onPress={onDismiss}
          disabled={isLoading}
        >
          <Text style={[styles.laterButtonText, { color: colors.text }]}>
            あとで
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.startButton, 
            { backgroundColor: checkInType === 'morning' ? '#FFA726' : '#7E57C2' }
          ]}
          onPress={handleStartChat}
          disabled={isLoading || (checkInType === 'morning' && goals.length === 0)}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.startButtonText}>
              {checkInType === 'morning' ? '計画を始める' : '振り返りを始める'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  date: {
    fontSize: 14,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalsList: {
    maxHeight: 150,
    marginBottom: 16,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  goalText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  laterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default DailyCheckInPrompt;
