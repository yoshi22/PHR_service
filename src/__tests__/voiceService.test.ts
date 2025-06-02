import { voiceService } from '../services/voiceService';

// Mock @react-native-voice/voice
jest.mock('@react-native-voice/voice', () => ({
  start: jest.fn(),
  stop: jest.fn(),
  destroy: jest.fn(),
  onSpeechResults: jest.fn(),
  onSpeechError: jest.fn(),
  onSpeechStart: jest.fn(),
  onSpeechEnd: jest.fn()
}));

describe('VoiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize without errors', () => {
    expect(voiceService).toBeDefined();
    expect(typeof voiceService.startVoiceRecognition).toBe('function');
    expect(typeof voiceService.stopVoiceRecognition).toBe('function');
  });

  it('should start listening', async () => {
    const result = await voiceService.startVoiceRecognition();
    expect(result).toBeUndefined();
  });

  it('should stop listening', async () => {
    const result = await voiceService.stopVoiceRecognition();
    expect(result).toBeUndefined();
  });
});
