/**
 * Badge definitions and catalog
 * All possible badges that users can earn
 */

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: 'steps' | 'streak' | 'special' | 'milestone'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  requirement: string
  unlockCriteria?: string
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Steps badges
  {
    id: '7500_steps',
    name: '1日7500歩達成',
    description: '1日で7500歩を達成しました',
    icon: '🏅',
    category: 'steps',
    rarity: 'common',
    requirement: '1日で7500歩以上歩く',
  },
  {
    id: '10000_steps',
    name: '1日10000歩達成',
    description: '1日で10000歩を達成しました',
    icon: '🥉',
    category: 'steps',
    rarity: 'common',
    requirement: '1日で10000歩以上歩く',
  },
  {
    id: '15000_steps',
    name: '1日15000歩達成',
    description: '1日で15000歩を達成しました',
    icon: '🥈',
    category: 'steps',
    rarity: 'rare',
    requirement: '1日で15000歩以上歩く',
  },
  {
    id: '20000_steps',
    name: '1日20000歩達成',
    description: '1日で20000歩を達成しました',
    icon: '🥇',
    category: 'steps',
    rarity: 'epic',
    requirement: '1日で20000歩以上歩く',
  },
  {
    id: '25000_steps',
    name: 'ウルトラウォーカー',
    description: '1日で25000歩の偉業を達成',
    icon: '👑',
    category: 'steps',
    rarity: 'legendary',
    requirement: '1日で25000歩以上歩く',
  },

  // Streak badges
  {
    id: '3days_streak',
    name: '3日連続7500歩達成',
    description: '3日連続で7500歩以上歩きました',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    requirement: '3日連続で7500歩以上歩く',
  },
  {
    id: '5days_streak',
    name: '5日連続7500歩達成',
    description: '5日連続で7500歩以上歩きました',
    icon: '⚡',
    category: 'streak',
    rarity: 'common',
    requirement: '5日連続で7500歩以上歩く',
  },
  {
    id: '7days_streak',
    name: '1週間連続達成',
    description: '7日連続で7500歩以上歩きました',
    icon: '🌟',
    category: 'streak',
    rarity: 'rare',
    requirement: '7日連続で7500歩以上歩く',
  },
  {
    id: '14days_streak',
    name: '2週間連続達成',
    description: '14日連続で7500歩以上歩きました',
    icon: '💎',
    category: 'streak',
    rarity: 'epic',
    requirement: '14日連続で7500歩以上歩く',
  },
  {
    id: '30days_streak',
    name: '1か月連続達成',
    description: '30日連続で7500歩以上歩きました',
    icon: '🏆',
    category: 'streak',
    rarity: 'legendary',
    requirement: '30日連続で7500歩以上歩く',
  },

  // Milestone badges
  {
    id: 'first_step',
    name: 'はじめの一歩',
    description: 'アプリを初めて使用しました',
    icon: '👣',
    category: 'milestone',
    rarity: 'common',
    requirement: 'アプリを初回起動する',
  },
  {
    id: 'week_warrior',
    name: '週間戦士',
    description: '1週間の目標を達成しました',
    icon: '⚔️',
    category: 'milestone',
    rarity: 'rare',
    requirement: '週間歩数目標を達成する',
  },
  {
    id: 'month_master',
    name: '月間マスター',
    description: '1か月の目標を達成しました',
    icon: '🎖️',
    category: 'milestone',
    rarity: 'epic',
    requirement: '月間歩数目標を達成する',
  },

  // Special badges
  {
    id: 'early_bird',
    name: '早起きウォーカー',
    description: '朝6時前に歩数を記録しました',
    icon: '🌅',
    category: 'special',
    rarity: 'rare',
    requirement: '朝6時前に歩数を記録する',
  },
  {
    id: 'night_owl',
    name: '夜ふかしウォーカー',
    description: '夜10時以降に歩数を記録しました',
    icon: '🌙',
    category: 'special',
    rarity: 'rare',
    requirement: '夜10時以降に歩数を記録する',
  },
  {
    id: 'weekend_warrior',
    name: '週末戦士',
    description: '週末に目標を達成しました',
    icon: '🎯',
    category: 'special',
    rarity: 'rare',
    requirement: '土日に歩数目標を達成する',
  },
]

/**
 * Get badge definition by ID
 */
export function getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(badge => badge.id === badgeId)
}

/**
 * Get badge definition by category
 */
export function getBadgesByCategory(category: BadgeDefinition['category']): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(badge => badge.category === category)
}

/**
 * Get badge definition by rarity
 */
export function getBadgesByRarity(rarity: BadgeDefinition['rarity']): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(badge => badge.rarity === rarity)
}

/**
 * Get rarity color for UI display
 */
export function getRarityColor(rarity: BadgeDefinition['rarity']): string {
  switch (rarity) {
    case 'common': return '#6B7280'
    case 'rare': return '#3B82F6'
    case 'epic': return '#8B5CF6'
    case 'legendary': return '#F59E0B'
    default: return '#6B7280'
  }
}

/**
 * Get category icon for UI display
 */
export function getCategoryIcon(category: BadgeDefinition['category']): string {
  switch (category) {
    case 'steps': return '👟'
    case 'streak': return '🔥'
    case 'milestone': return '🎯'
    case 'special': return '⭐'
    default: return '🏅'
  }
}
