import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';

import HealthConsultationScreen from '../screens/HealthConsultationScreen';
import CreateGoalScreen from '../screens/CreateGoalScreen';
import GoalListScreen from '../screens/GoalListScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen';

// Stack型の定義
export type HealthConsultationStackParamList = {
  HealthConsultation: undefined;
  CreateGoal: undefined;
  GoalDetail: { goalId?: string };
  EditGoal: { goalId: string };
  GoalList: undefined;
  AIChat: { initialMessage?: string; systemInstruction?: string };
  ExerciseLibrary: undefined;
};

const Stack = createNativeStackNavigator<HealthConsultationStackParamList>();

const HealthConsultationNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="HealthConsultation"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <Stack.Screen 
        name="HealthConsultation" 
        component={HealthConsultationScreen} 
        options={{ title: '健康相談', headerShown: false }}
      />
      <Stack.Screen 
        name="CreateGoal" 
        component={CreateGoalScreen} 
        options={{ title: '新しい目標' }} 
      />
      <Stack.Screen 
        name="GoalList" 
        component={GoalListScreen} 
        options={{ title: '目標リスト' }} 
      />
      <Stack.Screen 
        name="GoalDetail" 
        component={GoalDetailScreen} 
        options={{ title: '目標の詳細' }} 
      />
      <Stack.Screen 
        name="AIChat" 
        component={ChatScreen} 
        options={{ title: 'AI健康相談' }} 
      />
      <Stack.Screen 
        name="ExerciseLibrary" 
        component={ExerciseLibraryScreen} 
        options={{ title: 'エクササイズライブラリ' }} 
      />
    </Stack.Navigator>
  );
};

export default HealthConsultationNavigator;
