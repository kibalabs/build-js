const path = require('path');
const webpackBundleAnalyzer = require('webpack-bundle-analyzer');

const defaultParams = {
  dev: false,
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  return {
    mode: params.dev ? 'development' : 'production',
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
      ...(params.analyze ? [
        new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: 'json', reportFilename: './bundle-size.json' }),
        new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: 'static', reportFilename: './bundle-size.html' }),
      ] : [])
    ],
  };
}
