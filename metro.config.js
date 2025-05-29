// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1) Enable .cjs resolution for Firebase’s CJS modules
config.resolver.sourceExts.push('cjs');

// 2) Tell Metro to ignore package.json "exports" fields,
//    so it pulls in the Auth registration code from the CJS files.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
