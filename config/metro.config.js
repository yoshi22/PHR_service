// metro.config.js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const projectRoot = path.resolve(__dirname, '..');
const config = getDefaultConfig(projectRoot);

// Firebase の CJS モジュール (.cjs) を解決できるように
config.resolver.sourceExts.push('cjs', 'mjs');

// ESM の exports で Web SDK auth の CJS 部分が参照されないように
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
