import '@testing-library/jest-native/extend-expect';

// Mock Expo modules
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  AntDesign: 'AntDesign', 
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  Feather: 'Feather',
}));

jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// Mock console warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('React.createFactory')) return;
  if (args[0]?.includes?.('componentWillReceiveProps')) return;
  if (args[0]?.includes?.('componentWillMount')) return;
  originalWarn(...args);
};

// Global test ID generator mock
global.mockComponent = (name: string) => {
  return (props: any) => {
    const { testID, children, ...otherProps } = props;
    return {
      type: name,
      props: {
        ...otherProps,
        testID: testID || `${name.toLowerCase()}-test-id`,
        children,
      },
    };
  };
};

// Mock performance API
global.performance = {
  now: () => Date.now(),
} as any;
