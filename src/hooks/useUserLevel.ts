import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'

interface UserLevelData {
  level: number
  currentExp: number
  nextLevelExp: number
  totalSteps: number
  progressPercentage: number
}

/**
 * Hook to manage user level system based on total steps
 * Experience points calculation: 1 step = 1 exp
 * Level calculation: Level = floor(sqrt(totalSteps / 1000))
 */
export function useUserLevel() {
  const [levelData, setLevelData] = useState<UserLevelData>({
    level: 1,
    currentExp: 0,
    nextLevelExp: 1000,
    totalSteps: 0,
    progressPercentage: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate level from total steps
  const calculateLevel = (totalSteps: number): UserLevelData => {
    // Level formula: Level = floor(sqrt(totalSteps / 1000)) + 1
    const level = Math.floor(Math.sqrt(totalSteps / 1000)) + 1
    
    // Calculate experience needed for current level
    const currentLevelBase = Math.pow(level - 1, 2) * 1000
    const nextLevelBase = Math.pow(level, 2) * 1000
    
    const currentExp = totalSteps - currentLevelBase
    const nextLevelExp = nextLevelBase - currentLevelBase
    const progressPercentage = (currentExp / nextLevelExp) * 100

    return {
      level,
      currentExp,
      nextLevelExp,
      totalSteps,
      progressPercentage: Math.min(progressPercentage, 100)
    }
  }

  // Fetch user's total steps and calculate level
  const fetchUserLevel = useCallback(async () => {
    const user = auth?.currentUser
    if (!user) {
      setError('ユーザーが認証されていません')
      return
    }

    if (!db) {
      setError('Firebase Firestore が初期化されていません')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get all user steps from Firestore
      const stepsQuery = query(
        collection(db, 'userSteps'),
        where('userId', '==', user.uid)
      )
      
      const stepsSnapshot = await getDocs(stepsQuery)
      let totalSteps = 0
      
      stepsSnapshot.forEach(doc => {
        const stepData = doc.data()
        totalSteps += stepData.steps || 0
      })

      // Calculate level data
      const newLevelData = calculateLevel(totalSteps)
      setLevelData(newLevelData)

      // Save/update user level in Firestore
      const userLevelRef = doc(db, 'userLevel', user.uid)
      await setDoc(userLevelRef, {
        userId: user.uid,
        ...newLevelData,
        lastUpdated: new Date().toISOString()
      }, { merge: true })
      
      // Update cached level as well
      const cachedLevelRef = doc(db, 'cachedLevel', user.uid)
      await setDoc(cachedLevelRef, {
        userId: user.uid,
        level: newLevelData.level,
        currentExp: newLevelData.currentExp,
        nextLevelExp: newLevelData.nextLevelExp,
        totalSteps: newLevelData.totalSteps,
        progressPercentage: newLevelData.progressPercentage,
        updatedAt: new Date().toISOString()
      }, { merge: true })

    } catch (error: any) {
      console.error('Error fetching user level:', error)
      setError(error.message || 'レベル情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  // Get cached level data first, then update in background
  const fetchCachedLevel = useCallback(async () => {
    const user = auth?.currentUser
    if (!user || !db) return

    try {
      const cachedLevelRef = doc(db, 'cachedLevel', user.uid)
      const levelDoc = await getDoc(cachedLevelRef)
      
      if (levelDoc.exists()) {
        const data = levelDoc.data()
        setLevelData({
          level: data.level || 1,
          currentExp: data.currentExp || 0,
          nextLevelExp: data.nextLevelExp || 1000,
          totalSteps: data.totalSteps || 0,
          progressPercentage: data.progressPercentage || 0
        })
      } else {
        // Initialize cached level if not exists
        await setDoc(cachedLevelRef, {
          userId: user.uid,
          level: 1,
          currentExp: 0,
          nextLevelExp: 1000,
          totalSteps: 0,
          progressPercentage: 0,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching cached level:', error)
    }
  }, [])

  useEffect(() => {
    // First load cached data for immediate display
    fetchCachedLevel()
    // Then fetch fresh data
    fetchUserLevel()
  }, [fetchCachedLevel, fetchUserLevel])

  // Get level title based on level number
  const getLevelTitle = (level: number): string => {
    if (level >= 50) return '健康マスター'
    if (level >= 30) return 'ウォーキングチャンピオン'
    if (level >= 20) return 'アクティブエキスパート'
    if (level >= 15) return 'フィットネス愛好家'
    if (level >= 10) return 'ステップ上級者'
    if (level >= 5) return 'ヘルシーウォーカー'
    return '新米ウォーカー'
  }

  // Get steps needed for next level
  const getStepsToNextLevel = (): number => {
    return levelData.nextLevelExp - levelData.currentExp
  }

  return {
    levelData,
    loading,
    error,
    refetch: fetchUserLevel,
    getLevelTitle,
    getStepsToNextLevel
  }
}
