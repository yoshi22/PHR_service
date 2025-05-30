// Silence warnings related to timers
jest.useFakeTimers();

// モック: Firebase SDK imports
jest.mock('firebase/app', () => ({ initializeApp: jest.fn() }));
jest.mock('firebase/auth', () => ({ getAuth: jest.fn(() => ({})) }));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));
jest.mock('firebase/functions', () => ({ getFunctions: jest.fn(() => ({})) }));
