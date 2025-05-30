import React from 'react';
import { View, Text, StyleSheet, Platform, Image, ScrollView } from 'react-native';
import { usePermissions } from '../hooks/usePermissions';
import PrimaryButton from '../components/PrimaryButton';

export default function PermissionsScreen({ onPermissionGranted }: { onPermissionGranted: () => void }) {
  const { granted, loading, error, request } = usePermissions();
  // permissionGrantedフラグをRefを使って追跡し、一度だけコールバックを実行する
  const hasCalledPermissionGranted = React.useRef(false);

  // Effect to call callback when permissions are granted - but only once
  React.useEffect(() => {
    if (granted && !hasCalledPermissionGranted.current) {
      console.log('Permissions granted, calling callback (once)');
      hasCalledPermissionGranted.current = true;
      onPermissionGranted();
    }
  }, [granted, onPermissionGranted]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>ヘルスデータへのアクセス</Text>

      <Text style={styles.description}>
        歩数などの健康データを記録するために
        {Platform.OS === 'ios' ? 'ヘルスケア' : 'Google Fit'} 
        へのアクセス許可が必要です。
      </Text>

      <Text style={styles.benefits}>
        許可いただくと、以下の機能がご利用いただけます：{'\n'}
        • 毎日の歩数の記録と表示{'\n'}
        • 7日間の歩数グラフの表示{'\n'}
        • 目標達成時のバッジ獲得{'\n'}
      </Text>

      {error ? (
        <Text style={styles.error}>
          権限の取得に失敗しました: {error}
          {'\n'}再試行するには下のボタンを押してください。
        </Text>
      ) : null}

      <View style={styles.buttonContainer}>
        <PrimaryButton 
          title={loading ? '処理中...' : '許可する'} 
          onPress={async () => {
            try {
              const result = await request();
              // Let the useEffect handle the callback when permission state updates
              console.log('Permission request completed');
            } catch (e) {
              console.error("Permission request failed", e);
            }
          }} 
          disabled={loading} 
        />
      </View>

      <Text style={styles.privacyNote}>
        * お客様の健康データはデバイスとアカウントに安全に保存され、
        第三者と共有されることはありません。
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  image: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  benefits: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  error: {
    fontSize: 14,
    color: 'red',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#ffeeee',
    borderRadius: 5,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  privacyNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
