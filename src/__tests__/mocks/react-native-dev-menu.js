// Mock for react-native-dev-menu
export const DevMenu = {
  show: jest.fn(),
  hide: jest.fn(),
  isShown: jest.fn(() => false),
  reload: jest.fn(),
  debugRemoteJS: jest.fn(),
  addItem: jest.fn(),
  removeItem: jest.fn(),
  registerCallback: jest.fn(),
  unregisterCallback: jest.fn(),
};

export default DevMenu;
