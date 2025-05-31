import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, DarkTheme as NavigationDarkTheme, Theme } from '@react-navigation/native';

// 拡張テーマの型定義
export interface ExtendedTheme extends Theme {
  colors: Theme['colors'] & {
    // 追加のカラー定義
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    // アプリケーション固有のカラー
    accent: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    cardBackground: string;
    buttonBackground: string;
    buttonText: string;
    inputBackground: string;
    shadow: string;
  };
}

// ライトテーマ
export const LightTheme: ExtendedTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db',
    background: '#F7F7F7',
    card: '#FFFFFF',
    text: '#333333',
    border: '#e0e0e0',
    notification: '#FF3B30',
    accent: '#2ecc71',
    success: '#27ae60',
    error: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db',
    cardBackground: '#FFFFFF',
    buttonBackground: '#3498db',
    buttonText: '#FFFFFF',
    inputBackground: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
};

// ダークテーマ
export const DarkTheme: ExtendedTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#3498db',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#2D2D2D',
    notification: '#FF453A',
    accent: '#2ecc71',
    success: '#2ecc71',
    error: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db',
    cardBackground: '#2D2D2D',
    buttonBackground: '#3498db',
    buttonText: '#FFFFFF',
    inputBackground: '#333333',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

// テーマコンテキストの型定義
interface ThemeContextProps {
  theme: ExtendedTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

// テーマコンテキスト作成
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// テーマプロバイダーコンポーネント
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // システムの色スキーム設定を取得
  const colorScheme = useColorScheme();
  
  // ダークモードの状態管理
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // 初期化時にテーマ設定を読み込む
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const themePreference = await AsyncStorage.getItem('themePreference');
        
        if (themePreference === null) {
          // 保存された設定がない場合はシステム設定に基づく
          setIsDarkMode(colorScheme === 'dark');
        } else {
          // 保存された設定を使用
          setIsDarkMode(themePreference === 'dark');
        }
      } catch (error) {
        console.error('テーマ設定の読み込みエラー:', error);
        // エラー時はシステム設定をデフォルトとして使用
        setIsDarkMode(colorScheme === 'dark');
      }
    };
    
    loadThemePreference();
  }, [colorScheme]);
  
  // テーマ切り替え関数
  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('themePreference', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('テーマ設定の保存エラー:', error);
    }
  };
  
  // ダークモード設定関数
  const setDarkMode = async (isDark: boolean) => {
    setIsDarkMode(isDark);
    try {
      await AsyncStorage.setItem('themePreference', isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('テーマ設定の保存エラー:', error);
    }
  };
  
  // 現在のテーマを選択
  const theme = isDarkMode ? DarkTheme : LightTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// テーマフックの作成
export const useThemeContext = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
