import { saveBadge } from './badgeService';

/**
 * Phase 2 Special Badge Types
 */
export enum SpecialBadgeType {
  // 季節バッジ (Seasonal Badges)
  SPRING_AWAKENING = 'spring_awakening',
  SUMMER_SOLSTICE = 'summer_solstice', 
  AUTUMN_LEAVES = 'autumn_leaves',
  WINTER_WONDER = 'winter_wonder',
  
  // サプライズバッジ (Surprise Badges)
  LUCKY_DAY = 'lucky_day',
  MIDNIGHT_WALKER = 'midnight_walker',
  EARLY_BIRD = 'early_bird',
  RAINY_DAY_HERO = 'rainy_day_hero',
  
  // 記念日バッジ (Anniversary Badges)
  BIRTHDAY_SPECIAL = 'birthday_special',
  ONE_MONTH_ANNIVERSARY = 'one_month_anniversary',
  SIX_MONTH_ANNIVERSARY = 'six_month_anniversary',
  ONE_YEAR_ANNIVERSARY = 'one_year_anniversary',
  
  // 週末チャレンジ (Weekend Challenge)
  WEEKEND_WARRIOR = 'weekend_warrior',
  SATURDAY_SPECIAL = 'saturday_special',
  SUNDAY_FUNDAY = 'sunday_funday',
  WEEKEND_STREAK = 'weekend_streak',
}

/**
 * Badge metadata with display information
 */
export interface BadgeMetadata {
  type: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  category: 'Seasonal' | 'Surprise' | 'Anniversary' | 'Weekend' | 'Regular';
}

/**
 * All badge metadata including existing and new badges
 */
export const BADGE_METADATA: Record<string, BadgeMetadata> = {
  // Existing badges
  '7500_steps': {
    type: '7500_steps',
    name: '1日7500歩達成',
    description: '1日で7500歩以上歩きました',
    icon: '🏅',
    rarity: 'Common',
    category: 'Regular'
  },
  '10000_steps': {
    type: '10000_steps', 
    name: '1日10000歩達成',
    description: '1日で10000歩以上歩きました',
    icon: '🥇',
    rarity: 'Rare',
    category: 'Regular'
  },
  '3days_streak': {
    type: '3days_streak',
    name: '3日連続7500歩達成',
    description: '3日連続で7500歩以上歩きました',
    icon: '🔥',
    rarity: 'Rare',
    category: 'Regular'
  },
  '5days_streak': {
    type: '5days_streak',
    name: '5日連続7500歩達成', 
    description: '5日連続で7500歩以上歩きました',
    icon: '⚡',
    rarity: 'Epic',
    category: 'Regular'
  },

  // Phase 2: Seasonal Badges
  [SpecialBadgeType.SPRING_AWAKENING]: {
    type: SpecialBadgeType.SPRING_AWAKENING,
    name: '春の目覚め',
    description: '春の季節に特別な活動を達成しました',
    icon: '🌸',
    rarity: 'Rare',
    category: 'Seasonal'
  },
  [SpecialBadgeType.SUMMER_SOLSTICE]: {
    type: SpecialBadgeType.SUMMER_SOLSTICE,
    name: '夏至の輝き',
    description: '夏の最も長い日に素晴らしい活動をしました',
    icon: '☀️',
    rarity: 'Epic',
    category: 'Seasonal'
  },
  [SpecialBadgeType.AUTUMN_LEAVES]: {
    type: SpecialBadgeType.AUTUMN_LEAVES,
    name: '紅葉の散歩',
    description: '秋の美しい季節に健康的な活動をしました',
    icon: '🍁',
    rarity: 'Rare',
    category: 'Seasonal'
  },
  [SpecialBadgeType.WINTER_WONDER]: {
    type: SpecialBadgeType.WINTER_WONDER,
    name: '冬の奇跡',
    description: '寒い冬にも負けずに活動を続けました',
    icon: '❄️',
    rarity: 'Epic',
    category: 'Seasonal'
  },

  // Phase 2: Surprise Badges
  [SpecialBadgeType.LUCKY_DAY]: {
    type: SpecialBadgeType.LUCKY_DAY,
    name: '幸運の日',
    description: 'ランダムに選ばれた特別な幸運の日です',
    icon: '🍀',
    rarity: 'Legendary',
    category: 'Surprise'
  },
  [SpecialBadgeType.MIDNIGHT_WALKER]: {
    type: SpecialBadgeType.MIDNIGHT_WALKER,
    name: '夜中の散歩者',
    description: '深夜0時頃に歩数を記録しました',
    icon: '🌙',
    rarity: 'Epic',
    category: 'Surprise'
  },
  [SpecialBadgeType.EARLY_BIRD]: {
    type: SpecialBadgeType.EARLY_BIRD,
    name: '早起きの鳥',
    description: '朝5時前に歩数を記録しました',
    icon: '🐦',
    rarity: 'Rare',
    category: 'Surprise'
  },
  [SpecialBadgeType.RAINY_DAY_HERO]: {
    type: SpecialBadgeType.RAINY_DAY_HERO,
    name: '雨の日のヒーロー',
    description: '雨の日にも関わらず目標を達成しました',
    icon: '🌧️',
    rarity: 'Epic',
    category: 'Surprise'
  },

  // Phase 2: Anniversary Badges
  [SpecialBadgeType.BIRTHDAY_SPECIAL]: {
    type: SpecialBadgeType.BIRTHDAY_SPECIAL,
    name: '誕生日スペシャル',
    description: '誕生日に健康的な活動をしました',
    icon: '🎂',
    rarity: 'Legendary',
    category: 'Anniversary'
  },
  [SpecialBadgeType.ONE_MONTH_ANNIVERSARY]: {
    type: SpecialBadgeType.ONE_MONTH_ANNIVERSARY,
    name: '1ヶ月記念',
    description: 'アプリ使用開始から1ヶ月が経過しました',
    icon: '📅',
    rarity: 'Rare',
    category: 'Anniversary'
  },
  [SpecialBadgeType.SIX_MONTH_ANNIVERSARY]: {
    type: SpecialBadgeType.SIX_MONTH_ANNIVERSARY,
    name: '6ヶ月記念',
    description: 'アプリ使用開始から6ヶ月が経過しました',
    icon: '🎊',
    rarity: 'Epic',
    category: 'Anniversary'
  },
  [SpecialBadgeType.ONE_YEAR_ANNIVERSARY]: {
    type: SpecialBadgeType.ONE_YEAR_ANNIVERSARY,
    name: '1年記念',
    description: 'アプリ使用開始から1年が経過しました',
    icon: '🏆',
    rarity: 'Legendary',
    category: 'Anniversary'
  },

  // Phase 2: Weekend Challenge Badges
  [SpecialBadgeType.WEEKEND_WARRIOR]: {
    type: SpecialBadgeType.WEEKEND_WARRIOR,
    name: '週末戦士',
    description: '週末に特別な活動を達成しました',
    icon: '⚔️',
    rarity: 'Rare',
    category: 'Weekend'
  },
  [SpecialBadgeType.SATURDAY_SPECIAL]: {
    type: SpecialBadgeType.SATURDAY_SPECIAL,
    name: '土曜日スペシャル',
    description: '土曜日に特別なチャレンジをクリアしました',
    icon: '🎯',
    rarity: 'Rare',
    category: 'Weekend'
  },
  [SpecialBadgeType.SUNDAY_FUNDAY]: {
    type: SpecialBadgeType.SUNDAY_FUNDAY,
    name: 'サンデーファンデー',
    description: '日曜日に楽しく活動しました',
    icon: '🎈',
    rarity: 'Rare',
    category: 'Weekend'
  },
  [SpecialBadgeType.WEEKEND_STREAK]: {
    type: SpecialBadgeType.WEEKEND_STREAK,
    name: '週末連続達成',
    description: '連続して週末に目標を達成しました',
    icon: '🔥',
    rarity: 'Epic',
    category: 'Weekend'
  }
};

/**
 * Get badge metadata by type
 */
export function getBadgeMetadata(type: string): BadgeMetadata | null {
  return BADGE_METADATA[type] || null;
}

/**
 * Get all badges by category
 */
export function getBadgesByCategory(category: BadgeMetadata['category']): BadgeMetadata[] {
  return Object.values(BADGE_METADATA).filter(badge => badge.category === category);
}

/**
 * Get all badges by rarity
 */
export function getBadgesByRarity(rarity: BadgeMetadata['rarity']): BadgeMetadata[] {
  return Object.values(BADGE_METADATA).filter(badge => badge.rarity === rarity);
}

/**
 * Check if it's currently a specific season
 */
export function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * Check if today is weekend
 */
export function isWeekend(): boolean {
  const day = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

/**
 * Get day of week as string
 */
export function getDayOfWeek(): 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()] as any;
}

/**
 * Special Badge Checker Functions
 */

/**
 * Check for seasonal badges based on current date and activity
 */
export async function checkSeasonalBadges(userId: string, steps: number, date: string): Promise<void> {
  const season = getCurrentSeason();
  const currentDate = new Date();
  
  // Summer Solstice (June 21st) - currently summer
  if (season === 'summer' && steps >= 10000) {
    if (currentDate.getMonth() === 5 && currentDate.getDate() === 21) { // June 21st
      await saveBadge(userId, date, SpecialBadgeType.SUMMER_SOLSTICE);
    } else if (steps >= 7500) {
      // Regular summer badge for good activity
      await saveBadge(userId, date, SpecialBadgeType.SUMMER_SOLSTICE);
    }
  }
  
  // Other seasonal badges based on season and performance
  if (steps >= 8000) {
    switch (season) {
      case 'spring':
        await saveBadge(userId, date, SpecialBadgeType.SPRING_AWAKENING);
        break;
      case 'autumn':
        await saveBadge(userId, date, SpecialBadgeType.AUTUMN_LEAVES);
        break;
      case 'winter':
        await saveBadge(userId, date, SpecialBadgeType.WINTER_WONDER);
        break;
    }
  }
}

/**
 * Check for surprise badges based on random conditions and time
 */
export async function checkSurpriseBadges(userId: string, steps: number, date: string): Promise<void> {
  const currentTime = new Date();
  const hour = currentTime.getHours();
  
  // Early Bird (before 5 AM)
  if (hour < 5 && steps >= 1000) {
    await saveBadge(userId, date, SpecialBadgeType.EARLY_BIRD);
  }
  
  // Midnight Walker (around midnight 11PM-1AM)
  if ((hour >= 23 || hour <= 1) && steps >= 2000) {
    await saveBadge(userId, date, SpecialBadgeType.MIDNIGHT_WALKER);
  }
  
  // Lucky Day (random 5% chance for users with good activity)
  if (steps >= 7500 && Math.random() < 0.05) {
    await saveBadge(userId, date, SpecialBadgeType.LUCKY_DAY);
  }
  
  // Rainy Day Hero (simulate weather check - would integrate with weather API in production)
  // For now, random 10% chance to simulate rainy day
  if (steps >= 7500 && Math.random() < 0.1) {
    await saveBadge(userId, date, SpecialBadgeType.RAINY_DAY_HERO);
  }
}

/**
 * Check for weekend challenge badges
 */
export async function checkWeekendBadges(userId: string, steps: number, date: string): Promise<void> {
  const dayOfWeek = getDayOfWeek();
  
  if (isWeekend()) {
    // Weekend Warrior - high activity on weekend
    if (steps >= 10000) {
      await saveBadge(userId, date, SpecialBadgeType.WEEKEND_WARRIOR);
    }
    
    // Saturday Special
    if (dayOfWeek === 'saturday' && steps >= 8000) {
      await saveBadge(userId, date, SpecialBadgeType.SATURDAY_SPECIAL);
    }
    
    // Sunday Funday  
    if (dayOfWeek === 'sunday' && steps >= 8000) {
      await saveBadge(userId, date, SpecialBadgeType.SUNDAY_FUNDAY);
    }
  }
}

/**
 * Check for anniversary badges based on user registration date
 */
export async function checkAnniversaryBadges(userId: string, userRegistrationDate: Date, date: string): Promise<void> {
  const currentDate = new Date();
  const registrationDate = new Date(userRegistrationDate);
  
  // Calculate time difference
  const timeDiff = currentDate.getTime() - registrationDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  
  // One month (30 days)
  if (daysDiff >= 30 && daysDiff < 31) {
    await saveBadge(userId, date, SpecialBadgeType.ONE_MONTH_ANNIVERSARY);
  }
  
  // Six months (180 days)
  if (daysDiff >= 180 && daysDiff < 181) {
    await saveBadge(userId, date, SpecialBadgeType.SIX_MONTH_ANNIVERSARY);
  }
  
  // One year (365 days)
  if (daysDiff >= 365 && daysDiff < 366) {
    await saveBadge(userId, date, SpecialBadgeType.ONE_YEAR_ANNIVERSARY);
  }
  
  // Birthday badge (would need user birthday in profile)
  // For now, check if it's a special day in the year
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();
  // Example: If user sets birthday in profile, check against that
  // await saveBadge(userId, date, SpecialBadgeType.BIRTHDAY_SPECIAL);
}

/**
 * Main function to check all Phase 2 special badges
 */
export async function checkAllSpecialBadges(
  userId: string, 
  steps: number, 
  date: string, 
  userRegistrationDate: Date
): Promise<void> {
  try {
    await Promise.all([
      checkSeasonalBadges(userId, steps, date),
      checkSurpriseBadges(userId, steps, date),
      checkWeekendBadges(userId, steps, date),
      checkAnniversaryBadges(userId, userRegistrationDate, date)
    ]);
  } catch (error) {
    console.error('Error checking special badges:', error);
  }
}
