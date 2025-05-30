// Polyfills for Firebase networking and encoding
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
// Base64 polyfill
// @ts-ignore
import { decode, encode } from 'base-64';
// @ts-ignore
if (!(global.btoa)) global.btoa = encode;
// @ts-ignore
if (!(global.atob)) global.atob = decode;
// Keep only polyfills; use default React Native networking

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
