import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// 運動カテゴリー
export type ExerciseCategory =
  | 'cardio'
  | 'strength'
  | 'flexibility'
  | 'balance'
  | 'recovery';

// エクササイズの難易度
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

// エクササイズのデータ型
export type Exercise = {
  id: string;
  name: string;
  japName: string;
  description: string;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  muscleGroups: string[];
  steps: string[];
  imageUrl?: string;
  videoUrl?: string;
  calories: number; // 30分あたりのおおよそのカロリー消費量
  equipment?: string[];
  duration?: number; // 推奨時間（分）
  tips?: string[];
  benefits: string[];
};

// サンプルデータ
const SAMPLE_EXERCISES: Exercise[] = [
  {
    id: 'ex001',
    name: 'Walking',
    japName: 'ウォーキング',
    description: '最も基本的な有酸素運動で、どこでも実践できます。姿勢を正し、腕を振りながら歩くことで効果が高まります。',
    category: 'cardio',
    difficulty: 'beginner',
    muscleGroups: ['legs', 'core'],
    steps: [
      '背筋を伸ばし、顎を引いた姿勢で立ちます',
      '肩の力を抜き、自然な状態にします',
      '踵から着地して、つま先で蹴り出します',
      '腕を前後に振って、リズミカルに歩きます',
    ],
    imageUrl: 'https://example.com/images/walking.jpg',
    calories: 120,
    duration: 30,
    tips: [
      '早歩きを取り入れると効果的です',
      '歩幅を少し広げるとより効果的です',
      '呼吸を意識して行いましょう',
    ],
    benefits: [
      '心肺機能の向上',
      '筋力の維持・向上',
      'ストレス軽減',
      '脂肪燃焼効果',
    ],
  },
  {
    id: 'ex002',
    name: 'Squat',
    japName: 'スクワット',
    description: '下半身の筋力を強化する基本的なエクササイズです。正しいフォームで行うことが重要です。',
    category: 'strength',
    difficulty: 'beginner',
    muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'core'],
    steps: [
      '足を肩幅に開き、つま先はやや外側に向けます',
      '胸を張り、背筋を伸ばします',
      '椅子に座るようにお尻を後ろに引きながら膝を曲げていきます',
      '太ももが床と平行になるまで下げます',
      '踵で床を押すようにして元の姿勢に戻ります',
    ],
    imageUrl: 'https://example.com/images/squat.jpg',
    calories: 150,
    equipment: [],
    tips: [
      '膝がつま先より前に出ないように注意',
      '背中を丸めないようにする',
      '呼吸を止めないように注意',
    ],
    benefits: [
      '下半身の筋力強化',
      '基礎代謝の向上',
      '姿勢の改善',
      '関節の安定性向上',
    ],
  },
  {
    id: 'ex003',
    name: 'Plank',
    japName: 'プランク',
    description: 'コア（体幹）を強化するスタティックエクササイズです。正しい姿勢を保つことが重要です。',
    category: 'strength',
    difficulty: 'intermediate',
    muscleGroups: ['core', 'shoulders', 'back'],
    steps: [
      'うつ伏せになり、肘を肩の真下に置きます',
      'つま先を立て、肘と足の指で体を支えます',
      '頭からかかとまでが一直線になるようにします',
      'お腹に力を入れて姿勢を保ちます',
    ],
    imageUrl: 'https://example.com/images/plank.jpg',
    calories: 80,
    duration: 1,
    equipment: [],
    tips: [
      'お尻が上がったり下がったりしないように注意',
      '背中を丸めないように注意',
      '呼吸を止めないように注意',
    ],
    benefits: [
      '体幹強化',
      '姿勢の改善',
      '腰痛予防',
      '全身の安定性向上',
    ],
  },
  {
    id: 'ex004',
    name: 'Push-up',
    japName: '腕立て伏せ',
    description: '上半身の筋力を強化する基本的なエクササイズです。難易度調整が可能です。',
    category: 'strength',
    difficulty: 'intermediate',
    muscleGroups: ['chest', 'shoulders', 'triceps', 'core'],
    steps: [
      '手を肩幅より少し広めに開き、床につきます',
      '足をまっすぐ伸ばし、つま先を立てます',
      '頭からかかとまでが一直線になるようにします',
      '肘を曲げて体を床に近づけます',
      '肘を伸ばして元の位置に戻ります',
    ],
    imageUrl: 'https://example.com/images/pushup.jpg',
    calories: 100,
    equipment: [],
    tips: [
      '初心者は膝をついて行うとよいでしょう',
      'お尻が上がったり下がったりしないように注意',
      '肘は体の横に近づけるように曲げる',
    ],
    benefits: [
      '胸、肩、腕の筋力強化',
      '体幹の安定性向上',
      '姿勢の改善',
    ],
  },
  {
    id: 'ex005',
    name: 'Hamstring Stretch',
    japName: 'ハムストリングストレッチ',
    description: '太もも裏（ハムストリング）の柔軟性を高めるストレッチです。',
    category: 'flexibility',
    difficulty: 'beginner',
    muscleGroups: ['hamstrings', 'lower back'],
    steps: [
      '床に座り、片足を伸ばします',
      'もう片方の足は曲げて、伸ばした足の内側に足の裏をつけます',
      '上体を前に倒し、伸ばした足のつま先に手を伸ばします',
      '無理せず、太もも裏に心地よい伸びを感じる位置でキープします',
    ],
    imageUrl: 'https://example.com/images/hamstring_stretch.jpg',
    calories: 30,
    duration: 1,
    tips: [
      '反動をつけずにゆっくり行う',
      '呼吸を止めないように注意',
      '痛みがある場合は無理をしない',
    ],
    benefits: [
      '柔軟性の向上',
      '怪我の予防',
      '姿勢の改善',
      '血行促進',
    ],
  },
  {
    id: 'ex006',
    name: 'Meditation',
    japName: '瞑想',
    description: '心身のリラックスと回復を促すマインドフルネス実践です。',
    category: 'recovery',
    difficulty: 'beginner',
    muscleGroups: [],
    steps: [
      '静かな場所で快適な姿勢を取ります',
      '目を閉じるか、一点を柔らかく見つめます',
      '呼吸に意識を向け、ゆっくりと深く呼吸します',
      '思考が浮かんでも判断せず、呼吸に意識を戻します',
    ],
    imageUrl: 'https://example.com/images/meditation.jpg',
    calories: 20,
    duration: 10,
    tips: [
      '最初は短い時間から始める',
      '毎日同じ時間に行うと習慣化しやすい',
      '期待せず、経験そのものに集中する',
    ],
    benefits: [
      'ストレス軽減',
      '集中力向上',
      '睡眠の質改善',
      '血圧の安定',
    ],
  },
  {
    id: 'ex007',
    name: 'Dumbbell Row',
    japName: 'ダンベルロウ',
    description: '背中の筋肉を強化するエクササイズです。姿勢の改善にも効果的です。',
    category: 'strength',
    difficulty: 'intermediate',
    muscleGroups: ['back', 'biceps', 'shoulders'],
    steps: [
      '片手と片膝をベンチや安定した台に置きます',
      'もう片方の手にダンベルを持ちます',
      '背中を平らに保ち、ダンベルを持った腕を床と平行に垂らします',
      'ダンベルを体の横まで引き上げます',
      'ゆっくりと元の位置に戻します',
    ],
    imageUrl: 'https://example.com/images/dumbbell_row.jpg',
    calories: 120,
    equipment: ['dumbbell', 'bench'],
    tips: [
      '肘を体に近づけるように引く',
      '背中を丸めないように注意',
      '腕だけでなく背中の筋肉を使うイメージで',
    ],
    benefits: [
      '背中の筋力強化',
      '姿勢の改善',
      '肩こり予防',
    ],
  },
  {
    id: 'ex008',
    name: 'Jumping Jack',
    japName: 'ジャンピングジャック',
    description: '全身を使ったウォームアップや有酸素運動として効果的なエクササイズです。',
    category: 'cardio',
    difficulty: 'beginner',
    muscleGroups: ['legs', 'shoulders', 'core'],
    steps: [
      '足を揃えて立ち、腕を体側に付けます',
      'ジャンプしながら足を左右に開き、同時に腕を頭上で叩きます',
      'もう一度ジャンプして初期位置に戻ります',
      'リズミカルに繰り返します',
    ],
    imageUrl: 'https://example.com/images/jumping_jack.jpg',
    calories: 200,
    duration: 10,
    tips: [
      '着地は膝を少し曲げて衝撃を吸収する',
      'リズムを一定に保つ',
      '呼吸を止めないように注意',
    ],
    benefits: [
      '心肺機能の向上',
      '全身の筋肉の活性化',
      '代謝の向上',
      'コーディネーション能力の向上',
    ],
  },
  {
    id: 'ex009',
    name: 'Bicycle Crunch',
    japName: 'バイシクルクランチ',
    description: '腹筋、特に腹斜筋を強化するエクササイズです。',
    category: 'strength',
    difficulty: 'intermediate',
    muscleGroups: ['core', 'abs', 'obliques'],
    steps: [
      '仰向けに寝て、両手を頭の後ろで組みます',
      '膝を曲げて足を床から浮かせます',
      '右肘と左膝を近づけながら、右足を伸ばします',
      '反対側も同様に、左肘と右膝を近づけながら、左足を伸ばします',
      '自転車をこぐように交互に続けます',
    ],
    imageUrl: 'https://example.com/images/bicycle_crunch.jpg',
    calories: 150,
    duration: 5,
    tips: [
      '動きはゆっくりと制御して行う',
      '腹筋に力を入れ続ける',
      '首に負担がかからないよう注意',
    ],
    benefits: [
      '腹筋の強化',
      'コアの安定性向上',
      '姿勢の改善',
    ],
  },
  {
    id: 'ex010',
    name: 'Mountain Climber',
    japName: 'マウンテンクライマー',
    description: '全身を使った有酸素運動と筋力トレーニングを組み合わせたエクササイズです。',
    category: 'cardio',
    difficulty: 'intermediate',
    muscleGroups: ['core', 'shoulders', 'legs'],
    steps: [
      'プランクの姿勢をとります',
      '右膝を胸に向かって引き寄せます',
      '素早く足を入れ替え、左膝を胸に向かって引き寄せます',
      'リズミカルに交互に繰り返します',
    ],
    imageUrl: 'https://example.com/images/mountain_climber.jpg',
    calories: 180,
    duration: 3,
    tips: [
      'お尻が上がらないように注意',
      '背中はまっすぐに保つ',
      '呼吸を止めないように注意',
    ],
    benefits: [
      '心肺機能の向上',
      'コアの強化',
      '全身の持久力向上',
    ],
  },
  {
    id: 'ex011',
    name: 'Lunges',
    japName: 'ランジ',
    description: '下半身の筋力とバランス感覚を向上させるエクササイズです。',
    category: 'strength',
    difficulty: 'beginner',
    muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'core'],
    steps: [
      '足を肩幅に開いて立ちます',
      '片足を大きく前に踏み出します',
      '両膝が約90度になるまで腰を下げます',
      '前足を使って元の位置に戻ります',
      '反対側も同様に行います',
    ],
    imageUrl: 'https://example.com/images/lunges.jpg',
    calories: 140,
    equipment: [],
    tips: [
      '前に出した膝がつま先よりも前に出ないように注意',
      '上体はまっすぐに保つ',
      '後ろ足の膝は床すれすれまで下げる',
    ],
    benefits: [
      '下半身の筋力強化',
      'バランス感覚の向上',
      '姿勢の改善',
    ],
  },
  {
    id: 'ex012',
    name: 'Child\'s Pose',
    japName: 'チャイルドポーズ',
    description: '背中と股関節のストレッチに効果的なヨガのポーズです。リラックス効果もあります。',
    category: 'flexibility',
    difficulty: 'beginner',
    muscleGroups: ['back', 'hips'],
    steps: [
      '膝をついて座り、両膝を広げます',
      'お尻を踵に近づけるように下ろします',
      '上半身を前に倒し、額を床につけます',
      '腕を前に伸ばすか、体の横に置きます',
      '呼吸をしながらこの姿勢を保ちます',
    ],
    imageUrl: 'https://example.com/images/childs_pose.jpg',
    calories: 30,
    duration: 2,
    tips: [
      '呼吸は深くゆっくりと行う',
      '無理をせず、心地よい範囲で行う',
      '痛みがある場合は膝の間に枕や毛布を置く',
    ],
    benefits: [
      '背中と股関節の柔軟性向上',
      'リラックス効果',
      '呼吸の促進',
    ],
  },
];

const ExerciseLibraryScreen: React.FC = () => {
  const { colors } = useTheme();
  const [exercises, setExercises] = useState<Exercise[]>(SAMPLE_EXERCISES);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>(SAMPLE_EXERCISES);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<ExerciseDifficulty | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // 検索とフィルタリング
  useEffect(() => {
    let result = [...exercises];

    // テキスト検索
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      result = result.filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(lowerSearchText) ||
          exercise.japName.toLowerCase().includes(lowerSearchText) ||
          exercise.description.toLowerCase().includes(lowerSearchText) ||
          exercise.muscleGroups.some((muscle) => muscle.toLowerCase().includes(lowerSearchText))
      );
    }

    // カテゴリーフィルター
    if (selectedCategory) {
      result = result.filter((exercise) => exercise.category === selectedCategory);
    }

    // 難易度フィルター
    if (selectedDifficulty) {
      result = result.filter((exercise) => exercise.difficulty === selectedDifficulty);
    }

    setFilteredExercises(result);
  }, [searchText, selectedCategory, selectedDifficulty, exercises]);

  // カテゴリーフィルターを切り替える
  const toggleCategoryFilter = (category: ExerciseCategory) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  // 難易度フィルターを切り替える
  const toggleDifficultyFilter = (difficulty: ExerciseDifficulty) => {
    if (selectedDifficulty === difficulty) {
      setSelectedDifficulty(null);
    } else {
      setSelectedDifficulty(difficulty);
    }
  };

  // エクササイズの詳細を表示する
  const showExerciseDetail = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setModalVisible(true);
  };

  // 難易度に応じたカラーを返す
  const getDifficultyColor = (difficulty: ExerciseDifficulty) => {
    switch (difficulty) {
      case 'beginner':
        return '#4CAF50'; // green
      case 'intermediate':
        return '#FFC107'; // amber
      case 'advanced':
        return '#F44336'; // red
      default:
        return colors.text;
    }
  };

  // 難易度の日本語表示
  const getDifficultyText = (difficulty: ExerciseDifficulty) => {
    switch (difficulty) {
      case 'beginner':
        return '初級';
      case 'intermediate':
        return '中級';
      case 'advanced':
        return '上級';
      default:
        return '';
    }
  };

  // カテゴリーの日本語表示
  const getCategoryText = (category: ExerciseCategory) => {
    switch (category) {
      case 'cardio':
        return '有酸素運動';
      case 'strength':
        return '筋力トレーニング';
      case 'flexibility':
        return '柔軟性';
      case 'balance':
        return 'バランス';
      case 'recovery':
        return '回復';
      default:
        return '';
    }
  };

  // カテゴリーに応じたアイコンを返す
  const getCategoryIcon = (category: ExerciseCategory) => {
    switch (category) {
      case 'cardio':
        return 'heart';
      case 'strength':
        return 'barbell';
      case 'flexibility':
        return 'body';
      case 'balance':
        return 'fitness';
      case 'recovery':
        return 'bed';
      default:
        return 'help-circle';
    }
  };

  // エクササイズカードのレンダリング
  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={[styles.exerciseCard, { backgroundColor: colors.card }]}
      onPress={() => showExerciseDetail(item)}
    >
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseTitleContainer}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>{item.japName}</Text>
          <Text style={[styles.exerciseEnglishName, { color: colors.text }]}>({item.name})</Text>
        </View>
        <View style={styles.exerciseBadges}>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(item.difficulty) },
            ]}
          >
            <Text style={styles.difficultyText}>{getDifficultyText(item.difficulty)}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name={getCategoryIcon(item.category) as any} size={12} color="#FFF" style={styles.categoryIcon} />
            <Text style={styles.categoryText}>{getCategoryText(item.category)}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.exerciseDescription, { color: colors.text }]} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.exerciseFooter}>
        <View style={styles.muscleGroups}>
          {item.muscleGroups.slice(0, 3).map((muscle, index) => (
            <Text key={index} style={[styles.muscleTag, { backgroundColor: colors.border }]}>
              {muscle}
            </Text>
          ))}
          {item.muscleGroups.length > 3 && (
            <Text style={[styles.muscleTag, { backgroundColor: colors.border }]}>+{item.muscleGroups.length - 3}</Text>
          )}
        </View>
        <View style={styles.exerciseStats}>
          {item.calories && (
            <Text style={[styles.statText, { color: colors.text }]}>
              {item.calories} kcal/30min
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // フィルターチップのレンダリング
  const renderCategoryChips = () => {
    const categories: ExerciseCategory[] = ['cardio', 'strength', 'flexibility', 'balance', 'recovery'];
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.chip,
              {
                backgroundColor: selectedCategory === category ? colors.primary : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => toggleCategoryFilter(category)}
          >
            <Ionicons
              name={getCategoryIcon(category) as any}
              size={16}
              color={selectedCategory === category ? '#FFF' : colors.text}
            />
            <Text
              style={[
                styles.chipText,
                { color: selectedCategory === category ? '#FFF' : colors.text },
              ]}
            >
              {getCategoryText(category)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // 難易度チップのレンダリング
  const renderDifficultyChips = () => {
    const difficulties: ExerciseDifficulty[] = ['beginner', 'intermediate', 'advanced'];
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
        {difficulties.map((difficulty) => (
          <TouchableOpacity
            key={difficulty}
            style={[
              styles.chip,
              {
                backgroundColor: selectedDifficulty === difficulty ? getDifficultyColor(difficulty) : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => toggleDifficultyFilter(difficulty)}
          >
            <Text
              style={[
                styles.chipText,
                { color: selectedDifficulty === difficulty ? '#FFF' : colors.text },
              ]}
            >
              {getDifficultyText(difficulty)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // 詳細モーダルのレンダリング
  const renderExerciseDetailModal = () => {
    if (!selectedExercise) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedExercise.japName}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.text }]}>
                  {selectedExercise.name}
                </Text>
                
                <View style={styles.modalBadges}>
                  <View
                    style={[
                      styles.modalBadge,
                      { backgroundColor: getDifficultyColor(selectedExercise.difficulty) },
                    ]}
                  >
                    <Text style={styles.modalBadgeText}>
                      {getDifficultyText(selectedExercise.difficulty)}
                    </Text>
                  </View>
                  <View style={[styles.modalBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.modalBadgeText}>
                      {getCategoryText(selectedExercise.category)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>説明</Text>
                <Text style={[styles.modalText, { color: colors.text }]}>
                  {selectedExercise.description}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>ステップ</Text>
                {selectedExercise.steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                  </View>
                ))}
              </View>

              {selectedExercise.tips && selectedExercise.tips.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                    アドバイス
                  </Text>
                  {selectedExercise.tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <Ionicons name="bulb" size={16} color={colors.primary} />
                      <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>効果</Text>
                {selectedExercise.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
                  </View>
                ))}
              </View>

              {selectedExercise.muscleGroups && selectedExercise.muscleGroups.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                    鍛えられる筋肉
                  </Text>
                  <View style={styles.muscleTagContainer}>
                    {selectedExercise.muscleGroups.map((muscle, index) => (
                      <Text
                        key={index}
                        style={[styles.modalMuscleTag, { backgroundColor: colors.border }]}
                      >
                        {muscle}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {selectedExercise.equipment && selectedExercise.equipment.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                    必要な器具
                  </Text>
                  <View style={styles.equipmentContainer}>
                    {selectedExercise.equipment.map((item, index) => (
                      <View key={index} style={styles.equipmentItem}>
                        <Ionicons name="fitness" size={16} color={colors.text} />
                        <Text style={[styles.equipmentText, { color: colors.text }]}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>詳細情報</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="flame" size={20} color="#FF9800" />
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {selectedExercise.calories} kcal
                    </Text>
                    <Text style={[styles.infoLabel, { color: colors.text }]}>30分あたり</Text>
                  </View>
                  
                  {selectedExercise.duration && (
                    <View style={styles.infoItem}>
                      <Ionicons name="time" size={20} color="#2196F3" />
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {selectedExercise.duration} 分
                      </Text>
                      <Text style={[styles.infoLabel, { color: colors.text }]}>推奨時間</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>エクササイズライブラリ</Text>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="エクササイズを検索..."
            placeholderTextColor={colors.text + '80'}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearSearch}>
              <Ionicons name="close-circle" size={18} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderCategoryChips()}
      {renderDifficultyChips()}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={50} color={colors.text + '50'} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                検索条件に一致するエクササイズが見つかりませんでした。
              </Text>
            </View>
          }
        />
      )}

      {renderExerciseDetailModal()}
    </View>
  );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearSearch: {
    padding: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exerciseTitleContainer: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  exerciseEnglishName: {
    fontSize: 14,
    opacity: 0.7,
  },
  exerciseBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  difficultyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryBadge: {
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 12,
  },
  exerciseDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  muscleTag: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    fontSize: 12,
  },
  exerciseStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 12,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: '90%',
    borderRadius: 12,
    padding: 0,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalScroll: {
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  modalBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalBadge: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 4,
  },
  modalBadgeText: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  benefitText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  muscleTagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modalMuscleTag: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 4,
    fontSize: 14,
  },
  equipmentContainer: {
    marginTop: 8,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipmentText: {
    fontSize: 16,
    marginLeft: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  infoItem: {
    alignItems: 'center',
    width: '48%',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: '1%',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
});

export default ExerciseLibraryScreen;
