module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],
    plugins: [
      '@babel/plugin-syntax-import-meta',
      'react-native-worklets/plugin'
    ]
  };
};