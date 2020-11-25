const path = require('path');
const webpackBundleAnalyzer = require('webpack-bundle-analyzer');

module.exports = (config = {}) => ({
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
  },
  resolve: {
    alias: {
      '@src': path.join(process.cwd(), './src'),
    }
  },
  plugins: [
    ...(config.analyze ? [
      new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: 'json', reportFilename: './bundle-size.json' }),
      new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: 'static', reportFilename: './bundle-size.html' }),
    ] : [])
  ],
});
