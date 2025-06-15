# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
日本語で必ず返信してください
実機の再ビルドが必要な場合は必ず教えてください

## Development Commands

### Core Development
```bash
npm start              # Start Expo dev server with dev client
npm run ios           # Run on iOS simulator/device  
npm run android       # Run on Android emulator/device
npm run type-check    # TypeScript type checking
npm run format        # Prettier code formatting
```

### Firebase Testing & Validation
```bash
npm run test:firebase:full     # Comprehensive Firebase connectivity test
npm run test:firebase:security # Security rules testing
npm run check:env             # Environment variables validation
```

### Build & Release
```bash
npm run build:ios       # iOS debug build
npm run build:android   # Android debug build
npx expo prebuild --clean     # Clean regenerate native code (needed after native package changes)
```

## Architecture Overview

### Tech Stack
- **React Native + Expo SDK ~53.0.9** with development client
- **TypeScript** throughout codebase
- **Firebase v11.9.0** backend (Tokyo region: asia-northeast1)
- **React Navigation v6** for navigation
- **React Context API** for state management

### State Management Pattern
The app uses React Context extensively rather than Redux:
- `AuthContext` - Authentication state
- `ThemeContext` - Theme with system preference detection
- `SettingsContext` - User preferences
- `ErrorContext`, `LoadingContext`, `ToastContext` - UI state

Business logic is abstracted into custom hooks in `src/hooks/`.

### Firebase Integration
- **Authentication**: Firebase Auth with AsyncStorage persistence and retry logic
- **Firestore**: Regional deployment in Tokyo with security rules
- **Functions**: AI chat completion via OpenAI API integration
- **Configuration**: Uses Expo environment variables (EXPO_PUBLIC_*)

### Health Data Architecture
Platform-specific health integrations:
- **iOS**: HealthKit integration via `expo-health` and `react-native-health`
- **Android**: Google Fit integration
- **Wearables**: Support for Apple Watch, Fitbit, and Mi Band
- **Permissions**: Comprehensive permission management system

### AI/Coaching Features
- OpenAI integration through Firebase Functions
- Response caching (24-hour expiration)
- Context-aware prompts based on user health data
- Conversation history management in Firestore

### Key Service Files
- `src/services/healthService.ts` - Core health data operations
- `src/services/aiService.ts` - AI chat and coaching features  
- `src/services/firestoreService.ts` - Database operations
- `src/services/badgeService.ts` - Gamification system
- `src/services/voiceService.ts` - Voice reminder features

### Navigation Structure
Conditional navigation based on authentication:
- Unauthenticated: SignIn/SignUp screens
- Authenticated: MainTabs with nested navigators for different sections

### Gamification System
- Badge system with special achievements
- Daily bonus mechanics and streak tracking
- User level progression based on health activities

## Important Notes

### When Native Rebuild is Required
Always inform the user when changes require native rebuild:
- Adding/removing native packages
- Firebase configuration changes
- Expo configuration (app.json) changes
- babel.config.js or metro.config.js major changes

### Firebase Configuration
The app uses Firebase JS SDK (not React Native Firebase) with manual initialization and AsyncStorage persistence. Environment variables are required for proper Firebase connection.

### Multilingual Support
UI text is primarily in Japanese. Permission descriptions and error messages are localized for Japanese users.

### Theme System
Extended theme interface with app-specific colors, system preference detection, and persistent theme selection using AsyncStorage.