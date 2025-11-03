const { getDefaultConfig } = require("expo/metro-config");

process.env.EXPO_NO_ROUTER = "1";

const config = getDefaultConfig(__dirname);

// Fix for "Automatic publicPath is not supported" error
if (config.resolver) {
  config.resolver.sourceExts = config.resolver.sourceExts || [];
}

module.exports = config;
