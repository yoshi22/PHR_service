jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
  getFirestore: jest.fn(() => ({})),
} as any));
import { db } from '../../firebase'
import { saveBadge, getBadges, BadgeRecord } from '../badgeService'
import { doc, setDoc, serverTimestamp, collection, query, where, orderBy, getDocs } from 'firebase/firestore'

// Ensure query returns a non-undefined value for getDocs
;(query as jest.Mock).mockReturnValue('MOCK_QUERY')

describe('badgeService', () => {
  const mockDoc = { _key: 'mock' } as any
  const mockSnap = {
    docs: [
      { data: () => ({ date: '2025-05-29', type: '7500_steps', awardedAt: { toDate: () => new Date('2025-05-29T12:00:00Z') } }) },
      { data: () => ({ date: '2025-05-28', type: '3days_streak', awardedAt: { toDate: () => new Date('2025-05-28T09:00:00Z') } }) },
    ],
  } as any

  beforeEach(() => {
    // Re-mock query return so getDocs is called with valid query
    ;(query as jest.Mock).mockReturnValue('MOCK_QUERY')
    ;(doc as jest.Mock).mockReturnValue(mockDoc)
    ;(setDoc as jest.Mock).mockResolvedValue(undefined)
    ;(getDocs as jest.Mock).mockResolvedValue(mockSnap)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('saveBadge calls setDoc with correct parameters', async () => {
    await saveBadge('user1', '2025-05-30', 'test_badge')
    expect(doc).toHaveBeenCalledWith(db, 'userBadges', 'user1_2025-05-30_test_badge')
    expect(setDoc).toHaveBeenCalledWith(
      mockDoc,
      expect.objectContaining({ userId: 'user1', date: '2025-05-30', type: 'test_badge', awardedAt: serverTimestamp() }),
      { merge: true }
    )
  })

  it('getBadges returns sorted BadgeRecord array', async () => {
    const results: BadgeRecord[] = await getBadges('user1')
    expect(collection).toHaveBeenCalledWith(db, 'userBadges')
    expect(where).toHaveBeenCalledWith('userId', '==', 'user1')
    expect(orderBy).toHaveBeenCalledWith('awardedAt', 'desc')
    expect(getDocs).toHaveBeenCalledWith(expect.anything())
    expect(results).toEqual([
      { date: '2025-05-29', type: '7500_steps', awardedAt: new Date('2025-05-29T12:00:00Z') },
      { date: '2025-05-28', type: '3days_streak', awardedAt: new Date('2025-05-28T09:00:00Z') }],
    )
  })
})
