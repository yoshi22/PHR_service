// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Firebase の CJS モジュール (.cjs) を解決できるように
config.resolver.sourceExts.push('cjs', 'mjs');

// ESM の exports で Web SDK auth の CJS 部分が参照されないように
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
