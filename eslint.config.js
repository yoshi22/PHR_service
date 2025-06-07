const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'prefer-const': 'error',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'ios/**',
      'android/**',
      'metro.config.js',
      'babel.config.js',
      'eslint.config.js',
    ],
  },
];
