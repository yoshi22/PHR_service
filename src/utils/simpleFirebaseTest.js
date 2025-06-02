// Simple script to directly test Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with your actual API key when testing
  authDomain: "phrapp-261ae.firebaseapp.com",
  projectId: "phrapp-261ae",
  storageBucket: "phrapp-261ae.appspot.com",
  messagingSenderId: "129081600157",
  appId: "1:129081600157:web:735ef0f78136de4e0c962c",
  measurementId: "G-JNWSBVPVGN"
};

console.log('Firebase test configuration:');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);

// This is a sample test that can be updated with your actual API key
// for testing purposes only, but never commit the actual API key to source control
console.log('API Key format check:', 
  firebaseConfig.apiKey === "YOUR_API_KEY" ? 
  "⚠️ Using placeholder key" : 
  "✓ Key present (masked)");
