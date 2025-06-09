// Mock for react-native
import React from 'react';

// Mock common React Native components
const View = ({ children, ...props }) => React.createElement('div', props, children);
const Text = ({ children, ...props }) => React.createElement('span', props, children);
const TouchableOpacity = ({ children, onPress, ...props }) => 
  React.createElement('button', { ...props, onClick: onPress }, children);
const TextInput = (props) => React.createElement('input', props);
const ScrollView = ({ children, ...props }) => React.createElement('div', props, children);
const Image = (props) => React.createElement('img', props);
const SafeAreaView = ({ children, ...props }) => React.createElement('div', props, children);
const ActivityIndicator = (props) => React.createElement('div', { ...props, 'data-testid': props.testID || 'activity-indicator' }, 'Loading...');
const FlatList = ({ data, renderItem, ...props }) => {
  const items = data ? data.map((item, index) => renderItem({ item, index })) : [];
  return React.createElement('div', props, ...items);
};

// Mock StyleSheet
const StyleSheet = {
  create: (styles) => styles,
  hairlineWidth: 1,
  flatten: (styles) => styles,
  absoluteFill: {},
  absoluteFillObject: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};

// Mock Dimensions
const Dimensions = {
  get: (type) => ({
    width: 375,
    height: 812,
    scale: 2,
    fontScale: 1,
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock Platform
const Platform = {
  OS: 'ios',
  Version: '14.0',
  select: (options) => options.ios || options.default,
};

// Mock Alert
const Alert = {
  alert: jest.fn(),
  prompt: jest.fn(),
};

// Mock Animated
const Animated = {
  View: View,
  Text: Text,
  Image: Image,
  timing: jest.fn(() => ({
    start: jest.fn(),
  })),
  spring: jest.fn(() => ({
    start: jest.fn(),
  })),
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    interpolate: jest.fn(),
  })),
  createAnimatedComponent: (Component) => Component,
};

// Mock Keyboard
const Keyboard = {
  addListener: jest.fn(),
  removeListener: jest.fn(),
  dismiss: jest.fn(),
};

// Export all the mocks
module.exports = {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Animated,
  Keyboard,
  // Provide default export as well
  default: {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    SafeAreaView,
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Dimensions,
    Platform,
    Alert,
    Animated,
    Keyboard,
  }
};
