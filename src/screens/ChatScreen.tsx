import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Animated,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as aiService from '../services/aiService';
import { useAuth } from '../hooks/useAuth';
import { useHealthData } from '../hooks/useHealthData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { detectAndProcessSettingsIntent } from '../services/settingsIntentService';
import { useToast } from '../context/ToastContext';

// チャットメッセージの型定義
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isAnimating?: boolean;
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
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState<boolean>(false);
  
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { showToast } = useToast();
  const inputRef = useRef<TextInput>(null);
  
  const { user } = useAuth();
  const { healthData, loading: healthDataLoading } = useHealthData();

  // キーボード表示状態の監視
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // コンポーネントがマウントされたときに会話履歴を取得
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!user?.uid) return;
      
      try {
        // ローディングアニメーションを表示
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        
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
      } finally {
        // フェードアウト
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    };
    
    loadConversationHistory();
  }, [user?.uid, fadeAnim]);

  // リストの末尾へスクロールする
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);
  
  // メッセージが変更されたら末尾へスクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // メッセージ送信処理
  const handleSend = async () => {
    if (!inputText.trim() || !user?.uid || isLoading) return;

    // ユーザーメッセージの追加
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      isAnimating: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputText;
    setInputText('');
    setIsLoading(true);
    
    // キーボードを閉じる
    Keyboard.dismiss();

    try {
      // 設定変更の意図を検出して処理
      if (user) {
        const settingsIntent = await detectAndProcessSettingsIntent(user.uid, userInput);
        
        if (settingsIntent && settingsIntent.type !== 'unknown') {
          // 設定変更の意図が検出された場合の処理
          setSettingsChanged(true);
          
          // 設定変更結果のメッセージを表示
          const systemMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: settingsIntent.success 
              ? `✅ ${settingsIntent.message}` 
              : `❌ ${settingsIntent.message}`,
            sender: 'ai',
            timestamp: new Date(),
            isAnimating: true,
          };
          
          setMessages((prev) => {
            const updatedPrev = prev.map(msg => 
              msg.id === userMessage.id ? { ...msg, isAnimating: false } : msg
            );
            return [...updatedPrev, systemMessage];
          });
          
          // 成功したら通知も表示
          if (settingsIntent.success) {
            showToast('success', settingsIntent.message);
            
            // 処理が終わったのでローディングを解除して関数を終了
            setTimeout(() => {
              setIsLoading(false);
              setMessages((prev) => 
                prev.map(msg => 
                  msg.id === systemMessage.id ? { ...msg, isAnimating: false } : msg
                )
              );
            }, 500);
            return;
          }
        }
      }
      
      // 健康データを準備
      const healthDataForAI = healthData || { steps: 0 };

      // AIサービスのメッセージ形式に変換
      const aiMessages: aiService.ChatMessage[] = [
        {
          role: 'user',
          content: userInput
        }
      ];

      // ユーザーの設定情報を取得
      let userSettings = null;
      if (user) {
        try {
          const { getGeneralSettings } = require('../services/settingsIntentService');
          userSettings = await getGeneralSettings(user.uid);
        } catch (error) {
          console.error('設定情報の取得に失敗しました', error);
        }
      }
      
      // AIレスポンスを取得
      const response = await aiService.getChatCompletion(aiMessages, healthDataForAI, userSettings);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // アニメーション付きでAIレスポンスを表示
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'ai',
        timestamp: new Date(),
        isAnimating: true,
      };
      
      setMessages((prev) => {
        // ユーザーメッセージのアニメーション状態を解除
        const updatedPrev = prev.map(msg => 
          msg.id === userMessage.id ? { ...msg, isAnimating: false } : msg
        );
        return [...updatedPrev, aiResponse];
      });
      
      // 少し遅延させてからアニメーション状態を解除
      setTimeout(() => {
        setMessages((prev) => 
          prev.map(msg => 
            msg.id === aiResponse.id ? { ...msg, isAnimating: false } : msg
          )
        );
      }, 500);
      
    } catch (error) {
      console.error('AIレスポンスの取得に失敗しました', error);
      // エラーメッセージ
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'すみません、応答の生成中にエラーが発生しました。もう一度お試しください。',
        sender: 'ai',
        timestamp: new Date(),
        isAnimating: true,
      };
      
      setMessages((prev) => {
        // ユーザーメッセージのアニメーション状態を解除
        const updatedPrev = prev.map(msg => 
          msg.id === userMessage.id ? { ...msg, isAnimating: false } : msg
        );
        return [...updatedPrev, errorMessage];
      });
      
      // 少し遅延させてからアニメーション状態を解除
      setTimeout(() => {
        setMessages((prev) => 
          prev.map(msg => 
            msg.id === errorMessage.id ? { ...msg, isAnimating: false } : msg
          )
        );
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  // 提案プロンプトをクリック
  const handlePromptSelect = useCallback((promptText: string) => {
    setInputText(promptText);
    // 少し遅延させてからテキスト入力にフォーカス
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // メッセージ表示用のレンダー関数
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isUserMessage = item.sender === 'user';
    const messageOpacity = item.isAnimating ? 0.7 : 1;
    
    return (
      <Animated.View 
        style={[
          styles.messageContainer,
          isUserMessage ? styles.userMessageContainer : styles.aiMessageContainer,
          { opacity: messageOpacity }
        ]}
      >
        <View style={[
          styles.messageBubble,
          isUserMessage 
            ? [styles.userBubble, { backgroundColor: colors.primary }] 
            : styles.aiBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUserMessage ? styles.userMessageText : styles.aiMessageText
          ]}>
            {item.text}
          </Text>
        </View>
        <Text style={[
          styles.timestamp,
          isUserMessage ? styles.userTimestamp : styles.aiTimestamp
        ]}>
          {formatMessageTime(item.timestamp)}
        </Text>
      </Animated.View>
    );
  }, [colors.primary]);

  // 時刻フォーマット
  const formatMessageTime = (date: Date) => {
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 提案プロンプトのリスト
  const promptSuggestions = useMemo(() => [
    { id: '1', text: "今日の歩数は健康に良い数値ですか？" },
    { id: '2', text: "毎日どのくらい歩くべきですか？" },
    { id: '3', text: "健康的な食事のアドバイスをください" },
    { id: '4', text: "良質な睡眠をとるコツは？" },
    { id: '5', text: "ストレス解消におすすめの方法は？" },
  ], []);

  // 健康データセクションのメモ化
  const healthDataSection = useMemo(() => (
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
        {promptSuggestions.map((prompt) => (
          <TouchableOpacity 
            key={prompt.id}
            style={styles.promptSuggestion}
            onPress={() => handlePromptSelect(prompt.text)}
            activeOpacity={0.7}
          >
            <Text style={styles.promptSuggestionText}>{prompt.text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  ), [healthData, colors.primary, promptSuggestions, handlePromptSelect]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.innerContainer}>
          {healthDataLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>健康データを読み込み中...</Text>
            </View>
          ) : (
            healthDataSection
          )}

          {/* メッセージ履歴のフェードインローディング表示 */}
          <Animated.View 
            style={[
              styles.historyLoadingContainer, 
              { opacity: fadeAnim }
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>会話履歴を読み込み中...</Text>
          </Animated.View>

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
          
          {isLoading && (
            <View style={styles.aiTypingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.aiTypingText}>AIが応答を生成中...</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
      
      <View style={[
        styles.inputContainer,
        { paddingBottom: Platform.OS === 'ios' ? (isKeyboardVisible ? 0 : insets.bottom) : 8 }
      ]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="質問を入力してください..."
          placeholderTextColor="#A0A0A0"
          multiline
          maxLength={500}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { 
              backgroundColor: inputText.trim() && !isLoading ? colors.primary : '#CCCCCC',
              opacity: inputText.trim() && !isLoading ? 1 : 0.7
            }
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  innerContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  messageContainer: {
    marginVertical: 6,
    paddingHorizontal: 10,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#007AFF', // iOS blue
  },
  aiBubble: {
    backgroundColor: '#FFFFFF', // White with border
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: '#8E8E93',
    alignSelf: 'flex-end',
  },
  aiTimestamp: {
    color: '#8E8E93',
    alignSelf: 'flex-start',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    margin: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyLoadingContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    color: '#707070',
    fontSize: 14,
  },
  aiTypingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  aiTypingText: {
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
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 44,
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
    minWidth: width / 4,
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
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 44,
    justifyContent: 'center',
  },
  promptSuggestionText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

export default ChatScreen;
