module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
    ],
    plugins: [
      // REMOVED: 'expo-router/babel', // This line was removed
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': '.',
            '~': '.',
          },
        },
      ],
    ],
  };
};
