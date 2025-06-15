import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  REMEMBER_ME: 'rememberMe',
  SAVED_EMAIL: 'savedEmail',
  SAVED_PASSWORD: 'savedPassword', // Note: In production, consider using Keychain/Keystore for passwords
} as const;

export interface SavedCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * 認証情報を保存する
 * @param credentials 保存する認証情報
 */
export async function saveCredentials(credentials: SavedCredentials): Promise<void> {
  try {
    if (credentials.rememberMe) {
      await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, credentials.email);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PASSWORD, credentials.password);
    } else {
      // 記憶しない場合は保存された情報を削除
      await clearCredentials();
    }
  } catch (error) {
    console.error('❌ Error saving credentials:', error);
  }
}

/**
 * 保存された認証情報を取得する
 * @returns 保存された認証情報またはnull
 */
export async function loadCredentials(): Promise<SavedCredentials | null> {
  try {
    const rememberMe = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    
    if (rememberMe === 'true') {
      const email = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_EMAIL);
      const password = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD);
      
      if (email && password) {
        return {
          email,
          password,
          rememberMe: true,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error loading credentials:', error);
    return null;
  }
}

/**
 * 保存された認証情報をクリアする
 */
export async function clearCredentials(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.REMEMBER_ME,
      STORAGE_KEYS.SAVED_EMAIL,
      STORAGE_KEYS.SAVED_PASSWORD,
    ]);
  } catch (error) {
    console.error('❌ Error clearing credentials:', error);
  }
}

/**
 * 「パスワードを記憶する」設定の状態を確認する
 * @returns 記憶する設定かどうか
 */
export async function isRememberMeEnabled(): Promise<boolean> {
  try {
    const rememberMe = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    return rememberMe === 'true';
  } catch (error) {
    console.error('❌ Error checking remember me status:', error);
    return false;
  }
}
