import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as aiService from '../services/aiService';
import { useAuth } from '../hooks/useAuth';
import { useHealthData } from '../hooks/useHealthData';

// チャットメッセージの型定義
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

// 初期メッセージ
const welcomeMessage: Message = {
  id: '0',
  text: 'こんにちは！あなたの健康管理AIアシスタントです。健康に関する質問や、アドバイスが必要なことがあれば、お気軽にお尋ねください。',
  sender: 'ai',
  timestamp: new Date(),
};

const ChatScreen: React.FC = () => {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  const { healthData, loading: healthDataLoading } = useHealthData();

  // コンポーネントがマウントされたときに会話履歴を取得
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (user?.uid) {
        try {
          const history = await aiService.getConversationHistory(user.uid);
          
          if (history.length > 0) {
            // AIサービスからの応答をメッセージフォーマットに変換
            const convertedMessages: Message[] = history.map((msg, index) => ({
              id: index.toString(),
              text: msg.content,
              sender: msg.role === 'user' ? 'user' : 'ai',
              timestamp: new Date(),
            }));
            
            if (convertedMessages.length > 0) {
              setMessages(convertedMessages);
            }
          }
        } catch (error) {
          console.error('会話履歴の読み込みに失敗しました', error);
        }
      }
    };
    
    loadConversationHistory();
  }, [user?.uid]);

  // メッセージ送信処理
  const handleSend = async () => {
    if (!inputText.trim() || !user?.uid) return;

    // ユーザーメッセージの追加
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // 健康データを準備
      const healthDataForAI = healthData || { steps: 0 };

      // AIサービスのメッセージ形式に変換
      const aiMessages: aiService.ChatMessage[] = [
        {
          role: 'user',
          content: userInput
        }
      ];

      // AIレスポンスを取得
      const response = await aiService.getChatCompletion(aiMessages, healthDataForAI);
      
      if (response.error) {
        throw new Error(response.error);
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      
    } catch (error) {
      console.error('AIレスポンスの取得に失敗しました', error);
      // エラーメッセージ
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'すみません、応答の生成中にエラーが発生しました。もう一度お試しください。',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // メッセージ表示用のレンダー関数
  const renderMessage = ({ item }: { item: Message }) => {
    const isUserMessage = item.sender === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUserMessage ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUserMessage ? [styles.userBubble, { backgroundColor: colors.primary }] : styles.aiBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUserMessage ? styles.userMessageText : styles.aiMessageText
          ]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.healthDataContainer}>
        <Text style={styles.healthDataTitle}>今日の健康データ</Text>
        <View style={styles.healthMetricsRow}>
          <View style={styles.healthMetric}>
            <Ionicons name="footsteps-outline" size={24} color={colors.primary} />
            <Text style={styles.metricValue}>{healthData?.steps || 0}</Text>
            <Text style={styles.metricLabel}>歩数</Text>
          </View>
          
          {healthData?.heartRate && (
            <View style={styles.healthMetric}>
              <Ionicons name="heart-outline" size={24} color={colors.primary} />
              <Text style={styles.metricValue}>{healthData.heartRate}</Text>
              <Text style={styles.metricLabel}>心拍数</Text>
            </View>
          )}
          
          {healthData?.sleepHours && (
            <View style={styles.healthMetric}>
              <Ionicons name="moon-outline" size={24} color={colors.primary} />
              <Text style={styles.metricValue}>{healthData.sleepHours}</Text>
              <Text style={styles.metricLabel}>睡眠時間</Text>
            </View>
          )}
        </View>
        <Text style={styles.healthTip}>
          ヒント: 健康データについて質問すると、AIがパーソナライズされたアドバイスを提供します。
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptSuggestionsScroll}>
          <TouchableOpacity 
            style={styles.promptSuggestion}
            onPress={() => setInputText("今日の歩数は健康に良い数値ですか？")}
          >
            <Text style={styles.promptSuggestionText}>今日の歩数は健康に良い数値ですか？</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.promptSuggestion}
            onPress={() => setInputText("毎日どのくらい歩くべきですか？")}
          >
            <Text style={styles.promptSuggestionText}>毎日どのくらい歩くべきですか？</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.promptSuggestion}
            onPress={() => setInputText("健康的な食事のアドバイスをください")}
          >
            <Text style={styles.promptSuggestionText}>健康的な食事のアドバイスをください</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>AIが応答を生成中...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="質問を入力してください..."
          placeholderTextColor="#A0A0A0"
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim() ? colors.primary : '#CCCCCC' }
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  messageContainer: {
    marginVertical: 6,
    paddingHorizontal: 10,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#007AFF', // iOS blue
  },
  aiBubble: {
    backgroundColor: '#E5E5EA', // iOS light gray
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#000000',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#707070',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  // 健康データ表示用のスタイル
  healthDataContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    margin: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  healthDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  healthMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  healthMetric: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#333333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  healthTip: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  promptSuggestionsScroll: {
    marginTop: 10,
  },
  promptSuggestion: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
  promptSuggestionText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

export default ChatScreen;
