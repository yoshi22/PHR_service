// Mock for firebase/auth
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [],
  refreshToken: 'test-refresh-token',
  tenantId: null,
  delete: jest.fn(() => Promise.resolve()),
  getIdToken: jest.fn(() => Promise.resolve('test-id-token')),
  getIdTokenResult: jest.fn(() => Promise.resolve({ token: 'test-id-token', claims: {} })),
  reload: jest.fn(() => Promise.resolve()),
  toJSON: jest.fn(() => ({})),
};

export const getAuth = jest.fn(() => ({
  currentUser: mockUser,
  onAuthStateChanged: jest.fn((callback) => {
    callback(mockUser);
    return jest.fn(); // unsubscribe function
  }),
  signOut: jest.fn(() => Promise.resolve()),
  updateCurrentUser: jest.fn(() => Promise.resolve()),
}));

export const signInWithEmailAndPassword = jest.fn(() => 
  Promise.resolve({
    user: mockUser,
    operationType: 'signIn',
    providerId: null,
  })
);

export const createUserWithEmailAndPassword = jest.fn(() =>
  Promise.resolve({
    user: mockUser,
    operationType: 'signIn',
    providerId: null,
  })
);

export const sendPasswordResetEmail = jest.fn(() => Promise.resolve());

export const signOut = jest.fn(() => Promise.resolve());

export const onAuthStateChanged = jest.fn((auth, callback) => {
  callback(mockUser);
  return jest.fn(); // unsubscribe function
});

export const User = mockUser;

export default {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
};
