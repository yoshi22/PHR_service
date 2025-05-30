// Mock firestore functions
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(() => ({ path: 'mockDoc' })),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'MOCK_TS'),
}));
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { saveTodaySteps } from '../firestoreService';
import { db } from '../../firebase';

describe('firestoreService', () => {
  beforeEach(() => {
    (doc as jest.Mock).mockClear();
    (setDoc as jest.Mock).mockClear();
    (serverTimestamp as jest.Mock).mockClear();
  });

  it('saveTodaySteps calls doc and setDoc with correct args', async () => {
    // Freeze date to 2025-05-30
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-05-30T10:00:00Z'));

    await saveTodaySteps('user1', 1234);

    // Expect doc called with db, collection name, and combined id
    expect(doc).toHaveBeenCalledWith(db, 'userSteps', 'user1_2025-05-30');
    // Expect setDoc called with merge timestamp
    expect(setDoc).toHaveBeenCalledWith(
      expect.any(Object),
      {
        userId: 'user1',
        date: '2025-05-30',
        steps: 1234,
        updatedAt: 'MOCK_TS',
      }
    );

    // Restore timers
    jest.useRealTimers();
  });
});
