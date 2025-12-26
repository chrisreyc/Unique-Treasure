/** @type {import('next').NextConfig} */
const webpack = require("webpack");

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "encoding");
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve("buffer/"),
        "@react-native-async-storage/async-storage": false,
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        })
      );
      // Define global and self for browser compatibility
      config.plugins.push(
        new webpack.DefinePlugin({
          "global": "globalThis",
          "self": "globalThis",
        })
      );
    } else {
      // Server-side: polyfill self for SSR
      config.plugins.push(
        new webpack.DefinePlugin({
          "self": "globalThis",
        })
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;

