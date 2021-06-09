const fs = require('fs');
const path = require('path');

const webpackBundleAnalyzer = require('webpack-bundle-analyzer');

const packageUtil = require('./packageUtil');
const PrintAssetSizesPlugin = require('../plugins/printAssetSizesPlugin');


module.exports = (inputParams = {}) => {
  const defaultParams = {
    dev: false,
    packageFilePath: path.join(process.cwd(), './package.json'),
    shouldAliasModules: true,
    name: undefined,
  };
  const params = { ...defaultParams, ...inputParams };
  const package = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const modules = packageUtil.getExternalModules(package);
  // NOTE(krishan711): this aliases all the modules declared in package.json to the one installed in node_modules
  // which makes it much simpler to use locally installed packages with common dependencies (e.g. react, react-dom)
  const localModules = shouldAliasModules ? (modules.reduce((accumulator, moduleName) => {
    accumulator[moduleName] = path.resolve(path.join(process.cwd(), './node_modules'), moduleName);
    return accumulator;
  }, {})) : {};
  return {
    name: params.name || package.name,
    mode: params.dev ? 'development' : 'production',
    resolve: {
      fallback: {
        fs: false,
        net: false,
        tls: false,
        path: 'path-browserify',
      },
      alias: {
        '@src': path.join(process.cwd(), './src'),
        ...localModules,
      },
    },
    output: {
      assetModuleFilename: 'assets/[hash][ext][query]',
    },
    performance: {
      hints: false,
    },
    infrastructureLogging: {
      level: 'warn',
    },
    plugins: [
      ...(!params.dev ? [new PrintAssetSizesPlugin()] : []),
      ...(params.analyze ? [
        new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: 'json', reportFilename: './bundle-size.json' }),
        new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: 'static', reportFilename: './bundle-size.html' }),
      ] : []),
    ],
  };
};
