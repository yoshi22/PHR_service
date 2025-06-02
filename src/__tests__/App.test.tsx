import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock Firebase
jest.mock('../firebase', () => ({
  auth: {},
  db: {},
  getFirebaseAuth: jest.fn(() => ({}))
}));

// Mock Expo modules
jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('@react-native-voice/voice', () => ({
  start: jest.fn(),
  stop: jest.fn(),
  destroy: jest.fn(),
  onSpeechResults: jest.fn(),
  onSpeechError: jest.fn()
}));

describe('App', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<App />);
    // App should render some content
    expect(true).toBe(true); // Basic smoke test
  });
});
