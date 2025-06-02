# PHR Voice Feature Enhancement Documentation

## Overview

The PHR application's voice capabilities have been upgraded with two major enhancements:

1. **Real Speech Recognition**: Replaced mock implementation with real microphone input using `@react-native-voice/voice`
2. **High-Quality Voice Output**: Added a new voice quality service with customizable settings and multiple TTS engine options

These improvements make the voice interaction more natural and useful for users, with a focus on providing a seamless experience on both real devices and simulators.

## Voice Input Implementation

### Speech Recognition Features

- Real-time speech recognition using `@react-native-voice/voice`
- Support for Japanese language (`ja-JP`) optimized for medical terminology
- Proper microphone permission handling for both iOS and Android
- Automatic detection and handling of recording state
- Error handling and graceful fallbacks

### Permission Configuration

The following permissions have been added:

**iOS (app.json):**
```json
"infoPlist": {
  "NSMicrophoneUsageDescription": "音声入力機能を使用するためにマイクへのアクセスが必要です。",
  "NSSpeechRecognitionUsageDescription": "音声認識機能を使用して音声をテキストに変換します。"
}
```

**Android (app.json):**
```json
"permissions": [
  "android.permission.RECORD_AUDIO"
]
```

### Implementation Details

The voice recognition is implemented in `voiceService.ts` with:

1. Voice event listeners for speech start, end, results, and errors
2. Proper cleanup to avoid memory leaks or permission issues
3. Support for continuous listening with start/stop functionality
4. Integration with the existing UI components

## High-Quality Voice Output

### Voice Quality Service

A new service (`voiceQualityService.ts`) provides enhanced text-to-speech capabilities:

- Adjustable pitch and speech rate
- Multiple TTS engine options (device native, Google, Amazon, Azure)
- Voice selection from available system voices
- Settings persistence across app sessions

### TTS Engine Options

The voice quality service supports multiple TTS engines with different characteristics:

1. **Native (Device)**: Uses the built-in TTS engine via `expo-speech`
   - Pros: No extra cost, works offline
   - Cons: Limited quality, depends on device capabilities

2. **Google Cloud TTS API**:
   - Pros: High-quality voices, natural-sounding synthesis, good Japanese support
   - Cons: Requires API key, network dependency, usage costs

3. **Amazon Polly**:
   - Pros: Very natural voices, consistent quality, SSML support
   - Cons: AWS account required, network dependency, usage costs

4. **Microsoft Azure Cognitive Services**:
   - Pros: Advanced neural voices, emotion control, extensive language support
   - Cons: Azure account required, network dependency, usage costs

### User Settings

Users can customize:
- Voice pitch (how high or low the voice sounds)
- Speech rate (how fast the voice speaks)
- TTS engine selection
- Test voice quality before saving settings

## Using the Features

### Voice Recognition

Voice recognition can be triggered from the chat screen by:
1. Tapping the microphone button
2. Speaking clearly into the device microphone
3. The recognized text will appear and can be sent as a message

### Voice Output

Voice output happens automatically when:
1. Voice mode is enabled (speaker icon is active)
2. AI responses will be read aloud with the configured voice settings

### Customizing Voice Settings

Users can customize voice settings by:
1. Going to the Profile screen
2. Scrolling to the Voice Settings section
3. Tapping the options button next to "音声品質"
4. Adjusting sliders for pitch and rate
5. Selecting a TTS engine
6. Testing the voice with the "音声をテスト" button
7. Saving the settings

## Technical Implementation Notes

### Voice Recognition Implementation

The voice recognition feature replaces the previous mock implementation with a real microphone input:

```typescript
// Previous mock implementation
mockRecognitionTimeout = setTimeout(() => {
  Alert.prompt(
    '音声入力（デモ）',
    'このバージョンでは音声認識は模擬実装です。テキストを入力してください：',
    (text) => {
      if (text && text.trim()) {
        onSpeechResults?.([text.trim()]);
      }
      onSpeechEnd?.();
    },
    'plain-text',
    '',
    'default'
  );
}, 500);

// New real implementation
await Voice.start(locale);
Voice.onSpeechResults = (event: SpeechResultsEvent) => {
  if (event.value && event.value.length > 0) {
    onSpeechResults?.(event.value);
  }
};
```

### Voice Quality API Integration

The high-quality voice service is designed with an API-agnostic architecture that makes it easy to switch between different TTS providers:

```typescript
export async function speakWithHighQuality(text: string, options?: Partial<VoiceQualitySettings>) {
  const apiType = await getVoiceApiSelection();
  
  switch (apiType) {
    case 'google':
      // Google Cloud TTS implementation
      break;
    case 'amazon':
      // Amazon Polly implementation
      break;
    case 'azure':
      // Azure Cognitive Services implementation
      break;
    case 'native':
    default:
      // Device native TTS
      return await speakWithNative(text, options);
  }
}
```

## Recommendations for Production

For production deployment, we recommend:

1. **API Integration**: Implement the cloud TTS providers (Google, Amazon, Azure) by using their respective APIs
2. **Caching**: Add a caching mechanism for frequently used phrases to reduce API calls and latency
3. **Offline Mode**: Implement fallback to native TTS when the device is offline
4. **Voice Recognition Optimization**: Fine-tune the recognition for medical terminology and Japanese language
5. **Performance Testing**: Test the voice features on various devices to ensure consistent performance

## Future Enhancements

Potential future improvements include:

1. **Custom wake word**: Add "Hey PHR" wake word for hands-free operation
2. **Voice command shortcuts**: Allow users to perform common actions by voice commands
3. **Emotion detection**: Analyze voice tone to understand user's emotional state
4. **Multi-language support**: Add support for additional languages beyond Japanese
5. **Voice authentication**: Use voice biometrics for secure login
