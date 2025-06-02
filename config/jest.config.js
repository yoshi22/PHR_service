module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  rootDir: '../',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)', '<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?|@testing-library)',
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};
