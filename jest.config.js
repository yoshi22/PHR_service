module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/__tests__/setup.js',
  ],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/src/__tests__/mocks/',
    '<rootDir>/src/__tests__/setup.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|expo-modules-core|expo-font|expo-constants|expo-device|expo-health|expo-notifications|expo-speech|expo-status-bar|expo-av|expo-build-properties|expo-dev-client|react-native-chart-kit|react-native-svg|react-native-health|react-native-google-fit|react-native-toast-message|react-native-ble-plx|react-native-gesture-handler|react-native-get-random-values|react-native-safe-area-context|react-native-screens|react-native-url-polyfill|react-native-dotenv|firebase|@firebase|date-fns|base-64|openai)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-modules-core$': '<rootDir>/src/__tests__/mocks/expo-modules-core.js',
    '^@expo/vector-icons(/.*)?$': '<rootDir>/src/__tests__/mocks/expo-vector-icons.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/__tests__/mocks/async-storage.js',
    '^react-native-dev-menu$': '<rootDir>/src/__tests__/mocks/react-native-dev-menu.js',
    '^firebase/app$': '<rootDir>/src/__tests__/mocks/firebase-app.js',
    '^firebase/auth$': '<rootDir>/src/__tests__/mocks/firebase-auth.js',
    '^firebase/firestore$': '<rootDir>/src/__tests__/mocks/firebase-firestore.js',
    '^react-native-health$': '<rootDir>/src/__tests__/mocks/react-native-health.js',
    '^react-native-google-fit$': '<rootDir>/src/__tests__/mocks/react-native-google-fit.js',
    '^../../services/healthService$': '<rootDir>/src/__tests__/mocks/healthService.js',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{test,spec}.{ts,tsx,js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx,js,jsx}',
    '!<rootDir>/src/**/__tests__/mocks/**',
    '!<rootDir>/src/**/__tests__/setup.*',
  ],
  globals: {
    __DEV__: true,
  },
};
