import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useStreakProtection } from '../hooks/useStreakProtection';

interface StreakProtectionSectionProps {
  streak: number;
  onUseProtection?: () => void;
}

export default function StreakProtectionSection({ streak, onUseProtection }: StreakProtectionSectionProps) {
  const { colors } = useTheme();
  const {
    protection,
    useProtection,
    isInRiskZone,
    daysUntilNextRefill
  } = useStreakProtection();
  
  const [processing, setProcessing] = useState(false);

  // ストリーク保護を使用するボタンをクリックしたときの処理
  const handleUseProtection = async () => {
    if (processing) return;
    
    if (!isInRiskZone) {
      Alert.alert(
        'ストリーク保護',
        'ストリーク保護は危険な状態（前日記録なし）の場合のみ使用できます。',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    if (protection?.activeProtections === 0) {
      Alert.alert(
        'ストリーク保護を使用できません',
        '保護回数がありません。2週間後に1つ補充されます。',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    Alert.alert(
      'ストリーク保護を使用しますか？',
      `現在の連続記録（${streak}日）を維持します。残りの保護: ${protection?.activeProtections}回`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '使用する',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            const success = await useProtection();
            setProcessing(false);
            
            if (success) {
              Alert.alert(
                'ストリーク保護が適用されました',
                `連続記録（${streak}日）は維持されます！`,
                [{ text: 'OK', style: 'default' }]
              );
              if (onUseProtection) {
                onUseProtection();
              }
            } else {
              Alert.alert(
                'エラー',
                'ストリーク保護の適用に失敗しました。',
                [{ text: 'OK', style: 'default' }]
              );
            }
          }
        }
      ]
    );
  };

  if (!protection) {
    return null;
  }

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Ionicons name="shield" size={24} color={isInRiskZone ? "#ff6b6b" : colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>ストリーク保護</Text>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.shieldRow}>
          {[...Array(3)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.shield, 
                { backgroundColor: i < protection.activeProtections ? colors.primary : colors.border }
              ]}
            >
              <Ionicons 
                name="shield" 
                size={20} 
                color={i < protection.activeProtections ? "#fff" : colors.card} 
              />
            </View>
          ))}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            利用可能: {protection.activeProtections}回
          </Text>
          {daysUntilNextRefill > 0 && protection.activeProtections < 3 && (
            <Text style={[styles.refillText, { color: colors.text }]}>
              次回補充まで: {daysUntilNextRefill}日
            </Text>
          )}
        </View>
      </View>

      {isInRiskZone && (
        <TouchableOpacity 
          style={[
            styles.useButton, 
            { 
              backgroundColor: protection.activeProtections > 0 ? colors.primary : colors.border,
              opacity: processing ? 0.7 : 1
            }
          ]}
          onPress={handleUseProtection}
          disabled={protection.activeProtections === 0 || processing}
        >
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
          <Text style={styles.useButtonText}>
            {processing ? '処理中...' : 'ストリーク保護を使用'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.description, { color: colors.text }]}>
        {isInRiskZone 
          ? '⚠️ 危険: 昨日の記録がありません。ストリーク保護を使用すると連続記録が維持されます。'
          : 'ストリーク保護は、記録を逃した日に連続記録を維持するためのセーフガードです。'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shieldRow: {
    flexDirection: 'row',
    marginRight: 16,
  },
  shield: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  infoContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  refillText: {
    fontSize: 14,
    marginTop: 4,
  },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  useButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
