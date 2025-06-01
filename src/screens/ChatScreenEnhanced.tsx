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
  TouchableWithoutFeedback,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeContext';
import * as aiService from '../services/aiService';
import { useAuth } from '../hooks/useAuth';
import { useHealthData } from '../hooks/useHealthData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVoiceFeatures } from '../hooks/useVoiceFeatures';

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

const ChatScreenEnhanced: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  
  const { user } = useAuth();
  const { healthData, loading: healthDataLoading } = useHealthData();
  const { 
    voiceState, 
    isSpeaking,
    startListening, 
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
    resetVoiceState
  } = useVoiceFeatures();

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
  }, [user?.uid]);

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
    if ((!inputText.trim() && !voiceState.results.length) || !user?.uid || isLoading) return;

    // Get text from either input field or voice recognition results
    const messageText = inputText.trim() || (voiceState.results.length > 0 ? voiceState.results[0] : '');
    if (!messageText) return;
    
    // ユーザーメッセージの追加
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      isAnimating: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = messageText;
    setInputText('');
    setIsLoading(true);
    
    // Reset voice state if coming from voice input
    if (voiceState.results.length > 0) {
      resetVoiceState();
    }
    
    // キーボードを閉じる
    Keyboard.dismiss();

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
        
        // If in voice mode, speak the AI response
        if (isVoiceMode) {
          speak(response.message);
        }
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

  // メッセージ送信領域のレンダリング処理
  const renderInputToolbar = () => {
    // Toggle voice recognition
    const toggleVoiceInput = () => {
      if (voiceState.isRecording) {
        stopListening();
      } else {
        startListening();
      }
    };
  
    // Toggle voice mode for AI responses
    const toggleVoiceMode = () => {
      if (isSpeaking) {
        stopSpeaking();
      }
      setIsVoiceMode(prev => !prev);
    };
    
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        <View style={styles.voiceControls}>
          <TouchableOpacity 
            style={[styles.voiceButton, isVoiceMode ? styles.voiceButtonActive : {}]} 
            onPress={toggleVoiceMode}
          >
            <Ionicons name={isVoiceMode ? "volume-high" : "volume-mute"} size={24} color={isVoiceMode ? colors.primary : "#666"} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputWrapper}>
          {voiceState.isRecording ? (
            <View style={styles.voiceInputContainer}>
              <Text style={styles.voiceText}>
                {voiceState.results.length > 0 
                  ? voiceState.results[0] 
                  : voiceState.error || "聞き取っています..."}
              </Text>
            </View>
          ) : (
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="メッセージを入力..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              testID="chat-input" // E2Eテスト用ID
            />
          )}
          
          <TouchableOpacity 
            style={[styles.voiceRecordButton, voiceState.isRecording ? styles.voiceStopButton : {}]} 
            onPress={toggleVoiceInput}
          >
            <Ionicons 
              name={voiceState.isRecording ? "stop" : "mic"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary, opacity: (!inputText.trim() && !voiceState.results.length) || isLoading ? 0.5 : 1 }
            ]} 
            onPress={handleSend} 
            disabled={(!inputText.trim() && !voiceState.results.length) || isLoading}
            testID="send-button" // E2Eテスト用ID
          >
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // メッセージバブルのレンダリング
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isAI = item.sender === 'ai';
    const messageTime = formatMessageTime(item.timestamp);
    
    return (
      <View 
        style={[
          styles.messageContainer, 
          isAI ? styles.aiMessageContainer : styles.userMessageContainer
        ]}
      >
        <View 
          style={[
            styles.messageBubble,
            isAI ? styles.aiBubble : styles.userBubble,
            item.isAnimating && { opacity: 0.7 }
          ]}
          testID={isAI ? "ai-message" : "user-message"} // E2Eテスト用ID
        >
          <Text style={[
            styles.messageText,
            isAI ? { color: colors.text } : { color: 'white' }
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.timestamp,
            isAI ? { color: colors.text } : { color: 'rgba(255, 255, 255, 0.7)' }
          ]}>
            {messageTime}
          </Text>
        </View>
      </View>
    );
  }, [colors]);

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {healthDataLoading && (
        <Animated.View 
          style={[
            styles.loadingOverlay, 
            { opacity: fadeAnim }
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} testID="loading-indicator" />
        </Animated.View>
      )}
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList} // messagesList に修正
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        testID="message-list" // E2Eテスト用ID
        // パフォーマンス最適化
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
        automaticallyAdjustContentInsets={true} // コンテンツ位置の自動調整
      />
      
      {renderInputToolbar()}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    paddingBottom: 0, // セーフエリアで自動調整されるため
  },
  innerContainer: {
    flex: 1,
    width: '100%',
  },
  messagesList: {
    paddingTop: 16,
    paddingBottom: 20,
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
  voiceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#E0F7FF',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    minHeight: 44,
  },
  voiceInputContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  voiceText: {
    color: '#333',
    fontSize: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 44,
  },
  voiceRecordButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  voiceStopButton: {
    backgroundColor: '#FF0000',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 100,
  },
});

export default ChatScreenEnhanced;
