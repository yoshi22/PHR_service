// Mock for expo-modules-core
export default {};

export const NativeModule = jest.fn();
export const NativeModulesProxy = {};
export const ProxyNativeModule = jest.fn();
export const requireNativeModule = jest.fn(() => ({}));
export const requireOptionalNativeModule = jest.fn(() => null);

export const EventEmitter = jest.fn().mockImplementation(() => ({
  addListener: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  emit: jest.fn(),
}));

export const SharedObject = jest.fn();
export const NativeView = jest.fn();
export const requireNativeView = jest.fn();
export const requireNativeViewManager = jest.fn();

export const Platform = {
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
};

export const UnavailabilityError = class extends Error {
  constructor(moduleName, methodName) {
    super(`Module "${moduleName}" is not available: method "${methodName}" is not supported`);
  }
};

export const CodedError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
};

export const createWebModule = jest.fn();
export const registerWebModule = jest.fn();

export const uuid = {
  v4: jest.fn(() => 'test-uuid-v4'),
};
