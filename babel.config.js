module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // No need for 'expo-router/babel' plugin here anymore in SDK 50+
  };
};
