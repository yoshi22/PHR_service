import React, { useState, useMemo } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  SafeAreaView
} from 'react-native'
import BadgeGalleryItem from './BadgeGalleryItem'
import { BADGE_METADATA, getBadgesByCategory, getBadgesByRarity, BadgeMetadata } from '../services/specialBadgeService'
import { BadgeRecord } from '../services/badgeService'

// Helper function to get rarity color
const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'Common': return '#8B7355'
    case 'Rare': return '#4A90E2'
    case 'Epic': return '#9B59B6'
    case 'Legendary': return '#F39C12'
    default: return '#8B7355'
  }
}

export interface BadgeGalleryProps {
  earnedBadges: BadgeRecord[]
  onBadgePress?: (metadata: BadgeMetadata, isEarned: boolean) => void
}

type CategoryTab = 'all' | 'Regular' | 'Seasonal' | 'Surprise' | 'Anniversary' | 'Weekend'

export default function BadgeGallery({ earnedBadges, onBadgePress }: BadgeGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('all')
  const [selectedBadge, setSelectedBadge] = useState<{
    definition: BadgeMetadata
    isEarned: boolean
    earnedDate?: string
  } | null>(null)

  // Create a map of earned badges for quick lookup
  const earnedBadgeMap = useMemo(() => {
    const map = new Map<string, BadgeRecord>()
    earnedBadges.forEach(badge => {
      map.set(badge.type, badge)
    })
    return map
  }, [earnedBadges])

  // Filter badges by selected category
  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'all') {
      return Object.values(BADGE_METADATA)
    }
    return getBadgesByCategory(selectedCategory)
  }, [selectedCategory])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = Object.keys(BADGE_METADATA).length
    const earned = earnedBadges.length
    const percentage = total > 0 ? Math.round((earned / total) * 100) : 0
    
    return { total, earned, percentage }
  }, [earnedBadges])

  const handleBadgePress = (metadata: BadgeMetadata) => {
    const earnedBadge = earnedBadgeMap.get(metadata.type)
    const isEarned = !!earnedBadge
    
    setSelectedBadge({
      definition: metadata,
      isEarned,
      earnedDate: earnedBadge?.date
    })
    
    onBadgePress?.(metadata, isEarned)
  }

  const categoryTabs: { key: CategoryTab; label: string; icon: string }[] = [
    { key: 'all', label: 'すべて', icon: '🏅' },
    { key: 'Regular', label: '基本', icon: '👟' },
    { key: 'Seasonal', label: '季節', icon: '🌸' },
    { key: 'Surprise', label: 'サプライズ', icon: '🎉' },
    { key: 'Anniversary', label: '記念日', icon: '🎊' },
    { key: 'Weekend', label: '週末', icon: '⚔️' },
  ]

  return (
    <View style={styles.container}>
      {/* Header with statistics */}
      <View style={styles.header}>
        <Text style={styles.title}>バッジコレクション</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {stats.earned}/{stats.total} ({stats.percentage}%)
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${stats.percentage}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Category tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {categoryTabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedCategory === tab.key && styles.activeTab
            ]}
            onPress={() => setSelectedCategory(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabText,
              selectedCategory === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Badge grid */}
      <ScrollView style={styles.badgeGrid} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {filteredBadges.map(metadata => {
            const earnedBadge = earnedBadgeMap.get(metadata.type)
            const isEarned = !!earnedBadge
            const isNew = earnedBadge?.isNew || false

            return (
              <BadgeGalleryItem
                key={metadata.type}
                definition={metadata}
                isEarned={isEarned}
                earnedDate={earnedBadge?.date}
                isNew={isNew}
                onPress={() => handleBadgePress(metadata)}
              />
            )
          })}
        </View>
      </ScrollView>

      {/* Badge detail modal */}
      <Modal
        visible={selectedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            {selectedBadge && (
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedBadge(null)}
                >
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
                
                <Text style={styles.modalIcon}>
                  {selectedBadge.isEarned ? selectedBadge.definition.icon : '❓'}
                </Text>
                
                <Text style={styles.modalTitle}>
                  {selectedBadge.isEarned ? selectedBadge.definition.name : '???'}
                </Text>
                
                <Text style={styles.modalDescription}>
                  {selectedBadge.isEarned 
                    ? selectedBadge.definition.description 
                    : selectedBadge.definition.description
                  }
                </Text>
                
                {selectedBadge.isEarned && selectedBadge.earnedDate && (
                  <Text style={styles.earnedDate}>
                    獲得日: {selectedBadge.earnedDate}
                  </Text>
                )}
                
                <View style={[
                  styles.rarityBadgeModal,
                  { backgroundColor: getRarityColor(selectedBadge.definition.rarity) }
                ]}>
                  <Text style={styles.rarityTextModal}>
                    {selectedBadge.definition.rarity.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginLeft: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 3,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  badgeGrid: {
    flex: 1,
    padding: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    margin: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
    minWidth: 280,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  earnedDate: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 12,
  },
  rarityBadgeModal: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rarityTextModal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
})
