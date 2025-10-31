const { getDefaultConfig } = require("expo/metro-config");

process.env.EXPO_NO_ROUTER = "1";

const config = getDefaultConfig(__dirname);

module.exports = config;
