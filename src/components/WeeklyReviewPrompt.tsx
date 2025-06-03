import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useNavigation } from '@react-navigation/native';
import { useCoachFeatures } from '../hooks/useCoachFeatures';

interface WeeklyReviewPromptProps {
  onDismiss?: () => void;
}

const WeeklyReviewPrompt: React.FC<WeeklyReviewPromptProps> = ({ onDismiss }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { prepareCoachingPrompt } = useCoachFeatures();
  const [isLoading, setIsLoading] = useState(false);

  // 週の始まりと終わりの日付を取得
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });

  // 週の始まりと終わりをフォーマット
  const weekStartStr = format(startDate, 'MM/dd', { locale: ja });
  const weekEndStr = format(endDate, 'MM/dd', { locale: ja });

  const handleStartReview = async () => {
    setIsLoading(true);
    try {
      const promptData = await prepareCoachingPrompt('weeklyReview');
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
      console.error('Error starting weekly review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          今週の振り返り
        </Text>
      </View>

      <Text style={[styles.weekRange, { color: colors.text }]}>
        {weekStartStr} 〜 {weekEndStr}
      </Text>

      <Text style={[styles.description, { color: colors.text }]}>
        今週の活動を振り返って、次週の目標を設定しましょう。健康習慣の継続をサポートします。
      </Text>

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
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          onPress={handleStartReview}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.startButtonText}>
              振り返りを始める
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
  weekRange: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
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

export default WeeklyReviewPrompt;
