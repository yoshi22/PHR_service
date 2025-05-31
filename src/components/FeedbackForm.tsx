import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { useAuth } from '../hooks/useAuth';
import crashlytics from '../services/crashlytics';

interface FeedbackFormProps {
  onClose: () => void;
}

type FeedbackType = 'bug' | 'feature' | 'ux' | 'performance' | 'other';

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // フィードバック送信
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('入力エラー', 'タイトルと詳細を入力してください。');
      return;
    }

    setIsSubmitting(true);

    try {
      const functions = getFunctions(getApp(), 'asia-northeast1');
      const submitFeedback = httpsCallable(functions, 'submitUserFeedback');

      const result = await submitFeedback({
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        feedbackType,
        title,
        description,
        timestamp: new Date().toISOString(),
        appVersion: '1.0.0', // TODO: 実際のアプリバージョンを取得
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        },
      });

      crashlytics.logAction('feedback_submitted', true, feedbackType);

      console.log('フィードバック送信成功:', result.data);
      setShowSuccess(true);

      // 3秒後に閉じる
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('フィードバック送信エラー:', error);
      crashlytics.logAction('feedback_submitted', false, String(error));
      Alert.alert(
        'エラー',
        'フィードバックの送信に失敗しました。後でもう一度お試しください。'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 成功メッセージ表示
  if (showSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={60} color={colors.primary} />
          <Text style={[styles.successText, { color: colors.text }]}>
            フィードバックを送信しました！
          </Text>
          <Text style={[styles.thankYouText, { color: colors.text }]}>
            貴重なご意見ありがとうございます。
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>フィードバック</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>
          フィードバックの種類
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeContainer}
        >
          {[
            { id: 'bug', label: 'バグ報告', icon: 'bug' },
            { id: 'feature', label: '機能提案', icon: 'bulb' },
            { id: 'ux', label: 'UX改善', icon: 'color-palette' },
            { id: 'performance', label: '性能問題', icon: 'speedometer' },
            { id: 'other', label: 'その他', icon: 'chatbox' },
          ].map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeButton,
                {
                  backgroundColor:
                    feedbackType === type.id ? colors.primary : colors.card,
                },
              ]}
              onPress={() => setFeedbackType(type.id as FeedbackType)}
            >
              <Ionicons
                name={type.icon as any}
                size={20}
                color={feedbackType === type.id ? '#fff' : colors.text}
              />
              <Text
                style={[
                  styles.typeText,
                  {
                    color: feedbackType === type.id ? '#fff' : colors.text,
                  },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.text }]}>タイトル</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="簡潔なタイトルを入力"
          placeholderTextColor="#888"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <Text style={[styles.label, { color: colors.text }]}>詳細</Text>
        <TextInput
          style={[
            styles.textArea,
            { backgroundColor: colors.card, color: colors.text },
          ]}
          placeholder="できるだけ詳しく状況を説明してください"
          placeholderTextColor="#888"
          multiline
          numberOfLines={6}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            (!title.trim() || !description.trim() || isSubmitting) && {
              opacity: 0.6,
            },
          ]}
          onPress={handleSubmit}
          disabled={!title.trim() || !description.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitText}>送信</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  typeText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 150,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 24,
    fontSize: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
    marginTop: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  thankYouText: {
    fontSize: 16,
  },
});

export default FeedbackForm;
