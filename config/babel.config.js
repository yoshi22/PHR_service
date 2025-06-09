// PHRApp/babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', '@babel/preset-typescript'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '../.env.local', // パスをルートディレクトリに修正
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
