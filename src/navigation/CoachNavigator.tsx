import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';

import CoachHomeScreen from '../screens/CoachHomeScreen';
import CreateGoalScreen from '../screens/CreateGoalScreen';
import GoalListScreen from '../screens/GoalListScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen';

// Stack型の定義を追加
export type CoachStackParamList = {
  CoachHome: undefined;
  CreateGoal: undefined;
  GoalDetail: { goalId?: string };
  EditGoal: { goalId: string };
  GoalList: undefined;
  Chat: { initialMessage?: string; systemInstruction?: string };
  ExerciseLibrary: undefined;
};

const Stack = createNativeStackNavigator<CoachStackParamList>();

const CoachNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="CoachHome"
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
        name="CoachHome" 
        component={CoachHomeScreen} 
        options={{ title: 'コーチング', headerShown: false }} 
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
        name="Chat" 
        component={ChatScreen} 
        options={{ title: 'AIコーチ' }} 
      />
      <Stack.Screen 
        name="ExerciseLibrary" 
        component={ExerciseLibraryScreen} 
        options={{ title: 'エクササイズライブラリ' }} 
      />
    </Stack.Navigator>
  );
};

export default CoachNavigator;
