import { useState, useEffect, useCallback } from 'react'
import { getBadges, BadgeRecord } from '../services/badgeService'
import { useAuth } from './useAuth'

/**
 * Hook to fetch badge history for current user.
 */
export function useBadges() {
  const { user } = useAuth()
  const [badges, setBadges] = useState<BadgeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch badges function
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

  useEffect(() => { fetchBadges() }, [user, fetchBadges])

  return { badges, loading, error, refetch: fetchBadges }
}
