import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

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

      // 2) Firestore にプロフィール情報を保存
      await setDoc(doc(db, 'users', uid), {
        email,
        birthDate: birthDate.toISOString(),
        gender,
        displayName: displayName || null,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        createdAt: new Date().toISOString(),
      });

      // 登録完了したら Home へ
      navigation.replace('Home');
    } catch (e: any) {
      console.error(e);
      Alert.alert('登録失敗', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>新規登録</Text>
      <TextInput
        style={styles.input}
        placeholder="メールアドレス"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="パスワード（6文字以上）"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title={`生年月日: ${birthDate.toLocaleDateString()}`}
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
      <TextInput
        style={styles.input}
        placeholder="氏名（任意）"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        style={styles.input}
        placeholder="身長（cm／任意）"
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
      />
      <TextInput
        style={styles.input}
        placeholder="体重（kg／任意）"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />

      <Button
        title={loading ? '登録中…' : '登録する'}
        onPress={onPressSignUp}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, marginBottom: 24, textAlign: 'center' },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginTop: 12,
  },
  picker: { width: '100%', marginTop: 12 },
});
