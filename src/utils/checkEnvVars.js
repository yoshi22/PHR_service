// Simple test to check environment variables
require('dotenv').config({ path: '.env.local' });

console.log('Environment variables check:');
const firebaseEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

firebaseEnvVars.forEach(key => {
  console.log(`${key}: ${process.env[key] ? '✓ Available' : '✗ Missing'}`);
});

// Log test users if available
console.log('\nTest user:');
if (process.env.TEST_USER_EMAIL) {
  console.log(`TEST_USER_EMAIL: ${process.env.TEST_USER_EMAIL}`);
} else {
  console.log('TEST_USER_EMAIL: ✗ Missing');
}

if (process.env.TEST_USER_PASSWORD) {
  console.log('TEST_USER_PASSWORD: ✓ Available (not shown for security)');
} else {
  console.log('TEST_USER_PASSWORD: ✗ Missing');
}
