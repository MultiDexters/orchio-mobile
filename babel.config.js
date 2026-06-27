module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // NOTE: do NOT add the Reanimated/worklets babel plugin here.
    // On Expo SDK 54, babel-preset-expo automatically includes
    // react-native-worklets/plugin (Reanimated 4) when it's installed.
  };
};
