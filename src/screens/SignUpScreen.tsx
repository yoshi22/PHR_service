import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import LoadingOverlay from '../components/LoadingOverlay';
import { formatDate } from '../utils/formatDate';
import colors from '../styles/colors';
import typography from '../styles/typography';

const DEFAULT_STEP_GOAL = 7500;
const DEFAULT_NOTIFICATION_TIME = '20:00';

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, marginBottom: 24, textAlign: 'center' },
  picker: { width: '100%', marginTop: 12 },
  flex: { flex: 1 },
});

export default function SignUpScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [displayName, setDisplayName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const onPressSignUp = async () => {
    // 入力チェック
    if (!email || !password) {
      return Alert.alert('エラー', 'メールとパスワードは必須です');
    }
    if (password.length < 6) {
      return Alert.alert('エラー', 'パスワードは6文字以上必要です');
    }
    if (birthDate > new Date()) {
      return Alert.alert('エラー', '生年月日が未来になっています');
    }

    setLoading(true);
    try {
      // 1) Firebase Auth にユーザー作成
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      console.log('Firebase Auth: User created successfully, user ID:', uid);

      // 2) Firestore にプロフィール情報を保存
      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        birthDate: birthDate.toISOString(),
        gender,
        displayName: displayName || null,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        createdAt: new Date().toISOString(),
      });

      // 3) ユーザー設定を初期化
      await setDoc(doc(db, 'userSettings', uid), {
        userId: uid,
        stepGoal: DEFAULT_STEP_GOAL,
        notificationTime: DEFAULT_NOTIFICATION_TIME,
        updatedAt: new Date().toISOString(),
      });
      
      // 4) ユーザープロフィールを初期化
      await setDoc(doc(db, 'userProfile', uid), {
        uid,
        email,
        name: displayName || '',
        createdAt: new Date().toISOString(),
        birthday: birthDate.toISOString(),
      });
      
      // 5) Initialize cached level
      await setDoc(doc(db, 'cachedLevel', uid), {
        userId: uid,
        level: 1,
        xp: 0,
        updatedAt: new Date().toISOString()
      });
      
      // 6) Initialize user level
      await setDoc(doc(db, 'userLevel', uid), {
        userId: uid,
        level: 1,
        xp: 0,
        updatedAt: new Date().toISOString()
      });
      
      // 7) Initialize daily bonus
      await setDoc(doc(db, 'dailyBonuses', uid), {
        userId: uid,
        lastBonusDate: null,
        consecutiveDays: 0,
        totalBonuses: 0,
        availableBonuses: 1,
        monthlyResetDate: new Date().toISOString().substring(0, 7), // YYYY-MM
        updatedAt: new Date().toISOString()
      });

      console.log('All user data initialized in Firestore collections');
      
      // 登録完了したらDashboardへ
      navigation.replace('MainTabs');
    } catch (e: any) {
      console.error('Firebase Error:', e.code, e.message);
      
      // Provide more user-friendly error messages
      let errorMessage = e.message;
      if (e.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に使用されています';
      } else if (e.code === 'auth/weak-password') {
        errorMessage = 'パスワードが弱すぎます。より強力なパスワードを使用してください';
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = '無効なメールアドレス形式です';
      }
      
      Alert.alert('登録失敗', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.flex} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, typography.h2, { color: colors.primary }]}>新規登録</Text>
        <InputField
          label="メールアドレス"
          placeholder="user@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <InputField
          label="パスワード"
          placeholder="6文字以上"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <PrimaryButton
          title={`生年月日: ${formatDate(birthDate)}`}
          onPress={() => setShowPicker(true)}
        />
        {showPicker && (
          <DateTimePicker
            value={birthDate}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={(_, date) => {
              setShowPicker(false);
              if (date) setBirthDate(date);
            }}
          />
        )}

        <Picker
          selectedValue={gender}
          onValueChange={(v) => setGender(v)}
          style={styles.picker}
        >
          <Picker.Item label="男性" value="male" />
          <Picker.Item label="女性" value="female" />
        </Picker>

        {/* 任意項目 */}
        <InputField
          label="氏名（任意）"
          placeholder="例: 山田 太郎"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <InputField
          label="身長（cm）"
          placeholder="例: 170"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />
        <InputField
          label="体重（kg）"
          placeholder="例: 60"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />

        {loading && <LoadingOverlay />}
        <PrimaryButton title={loading ? '登録中…' : '登録する'} onPress={onPressSignUp} disabled={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
