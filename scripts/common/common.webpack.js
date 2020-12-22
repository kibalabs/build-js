const fs = require('fs');
const path = require('path');
const webpackBundleAnalyzer = require('webpack-bundle-analyzer');

const PrintAssetSizesPlugin = require('../plugins/printAssetSizesPlugin');

const defaultParams = {
  dev: false,
  packagePath: undefined,
  name: undefined,
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  const packagePath = params.packagePath || path.join(process.cwd(), './package.json');
  const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return {
    name: params.name || package.name,
    mode: params.dev ? 'development' : 'production',
    resolve: {
      fallback: {
        fs: false,
        net: false,
        tls: false,
        path: require.resolve("path-browserify"),
      },
      alias: {
        '@src': path.join(process.cwd(), './src'),
      }
    },
    plugins: [
      ...(!params.dev ? [new PrintAssetSizesPlugin()] : []),
      ...(params.analyze ? [
        new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: 'json', reportFilename: './bundle-size.json' }),
        new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: 'static', reportFilename: './bundle-size.html' }),
      ] : [])
    ],
  };
}
