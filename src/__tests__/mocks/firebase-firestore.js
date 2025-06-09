// Mock for firebase/firestore
const mockDoc = {
  id: 'test-doc-id',
  exists: () => true,
  data: () => ({ test: 'data' }),
  get: jest.fn((field) => ({ test: 'data' }[field])),
  ref: {
    id: 'test-doc-id',
    path: 'test/test-doc-id',
    parent: {
      id: 'test',
      path: 'test',
    },
  },
};

const mockQuerySnapshot = {
  empty: false,
  size: 1,
  docs: [mockDoc],
  forEach: jest.fn((callback) => [mockDoc].forEach(callback)),
  map: jest.fn((callback) => [mockDoc].map(callback)),
};

const mockDocRef = {
  id: 'test-doc-id',
  path: 'test/test-doc-id',
  get: jest.fn(() => Promise.resolve(mockDoc)),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  onSnapshot: jest.fn((callback) => {
    callback(mockDoc);
    return jest.fn(); // unsubscribe function
  }),
  collection: jest.fn(() => mockCollectionRef),
  parent: {
    id: 'test',
    path: 'test',
  },
  withConverter: jest.fn(() => mockDocRef),
};

const mockCollectionRef = {
  id: 'test',
  path: 'test',
  add: jest.fn(() => Promise.resolve(mockDocRef)),
  doc: jest.fn(() => mockDocRef),
  get: jest.fn(() => Promise.resolve(mockQuerySnapshot)),
  where: jest.fn(() => mockQuery),
  orderBy: jest.fn(() => mockQuery),
  limit: jest.fn(() => mockQuery),
  onSnapshot: jest.fn((callback) => {
    callback(mockQuerySnapshot);
    return jest.fn(); // unsubscribe function
  }),
  withConverter: jest.fn(() => mockCollectionRef),
};

const mockQuery = {
  get: jest.fn(() => Promise.resolve(mockQuerySnapshot)),
  where: jest.fn(() => mockQuery),
  orderBy: jest.fn(() => mockQuery),
  limit: jest.fn(() => mockQuery),
  onSnapshot: jest.fn((callback) => {
    callback(mockQuerySnapshot);
    return jest.fn(); // unsubscribe function
  }),
  withConverter: jest.fn(() => mockQuery),
};

export const getFirestore = jest.fn(() => ({
  collection: jest.fn(() => mockCollectionRef),
  doc: jest.fn(() => mockDocRef),
  runTransaction: jest.fn((callback) => callback({
    get: jest.fn(() => Promise.resolve(mockDoc)),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
  batch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  })),
  enableNetwork: jest.fn(() => Promise.resolve()),
  disableNetwork: jest.fn(() => Promise.resolve()),
  terminate: jest.fn(() => Promise.resolve()),
  clearPersistence: jest.fn(() => Promise.resolve()),
}));

export const collection = jest.fn(() => mockCollectionRef);
export const doc = jest.fn(() => mockDocRef);
export const getDoc = jest.fn(() => Promise.resolve(mockDoc));
export const getDocs = jest.fn(() => Promise.resolve(mockQuerySnapshot));
export const setDoc = jest.fn(() => Promise.resolve());
export const updateDoc = jest.fn(() => Promise.resolve());
export const deleteDoc = jest.fn(() => Promise.resolve());
export const addDoc = jest.fn(() => Promise.resolve(mockDocRef));
export const query = jest.fn(() => mockQuery);
export const where = jest.fn(() => mockQuery);
export const orderBy = jest.fn(() => mockQuery);
export const limit = jest.fn(() => mockQuery);
export const startAt = jest.fn(() => mockQuery);
export const endAt = jest.fn(() => mockQuery);
export const startAfter = jest.fn(() => mockQuery);
export const endBefore = jest.fn(() => mockQuery);
export const onSnapshot = jest.fn((queryOrRef, callback) => {
  callback(mockQuerySnapshot);
  return jest.fn(); // unsubscribe function
});

export const serverTimestamp = jest.fn(() => ({ _methodName: 'serverTimestamp' }));
export const increment = jest.fn((value) => ({ _methodName: 'increment', _value: value }));
export const arrayUnion = jest.fn((...values) => ({ _methodName: 'arrayUnion', _values: values }));
export const arrayRemove = jest.fn((...values) => ({ _methodName: 'arrayRemove', _values: values }));

export const Timestamp = {
  now: jest.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
  fromDate: jest.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
  fromMillis: jest.fn((millis) => ({ seconds: Math.floor(millis / 1000), nanoseconds: 0 })),
};

export default {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAt,
  endAt,
  startAfter,
  endBefore,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
};
