import { useState, useEffect, useCallback } from 'react'
import { getBadges, subscribeToBadges, BadgeRecord, onBadgeAcquired } from '../services/badgeService'
import { useAuth } from './useAuth'
import { useToast } from '../context/ToastContext'

/**
 * Hook to fetch badge history for current user.
 */
export function useBadges() {
  const { user } = useAuth()
  const { showBadgeAcquired } = useToast()
  const [badges, setBadges] = useState<BadgeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newBadgeCount, setNewBadgeCount] = useState(0)

  // Get badge display label from type
  const getBadgeLabel = useCallback((type: string): string => {
    switch (type) {
      case '7500_steps': return '1日7500歩達成'
      case '3days_streak': return '3日連続7500歩達成'
      case '5days_streak': return '5日連続7500歩達成'
      case '10000_steps': return '1日10000歩達成'
      default: return type
    }
  }, [])
  
  // Handle new badge acquisition
  const handleNewBadge = useCallback((badge: BadgeRecord) => {
    if (badge.isNew) {
      showBadgeAcquired(getBadgeLabel(badge.type))
      setNewBadgeCount(prev => prev + 1)
    }
  }, [showBadgeAcquired, getBadgeLabel])

  // Initial fetch and subscribe to updates
  useEffect(() => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    // Initial fetch
    getBadges(user.uid)
      .then(records => {
        setBadges(records)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToBadges(user.uid, updatedBadges => {
      setBadges(updatedBadges)
      setLoading(false)
    })
    
    // Subscribe to badge acquisition events
    const badgeListener = onBadgeAcquired(handleNewBadge)
    
    return () => {
      unsubscribe()
      badgeListener()
    }
  }, [user, handleNewBadge])

  // Manual refresh function
  const fetchBadges = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const records = await getBadges(user.uid)
      setBadges(records)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  return { 
    badges, 
    loading, 
    error, 
    refetch: fetchBadges,
    newBadgeCount
  }
}
