const fs = require('fs');
const path = require('path');

const webpackBundleAnalyzer = require('webpack-bundle-analyzer');

const PrintAssetSizesPlugin = require('../plugins/printAssetSizesPlugin');
const { removeUndefinedProperties } = require('../util');
const packageUtil = require('./packageUtil');

const defaultParams = {
  dev: false,
  analyzeBundle: false,
  packageFilePath: undefined,
  shouldAliasModules: true,
  cleanOutputDirectory: true,
  name: undefined,
};

module.exports = (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const package = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const modules = packageUtil.getExternalModules(package);
  // NOTE(krishan711): this aliases all the modules declared in package.json to the one installed in node_modules
  // which makes it much simpler to use locally installed packages with common dependencies (e.g. react, react-dom)
  const localModules = params.shouldAliasModules ? (modules.reduce((accumulator, moduleName) => {
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
      },
      alias: {
        '@src': path.join(process.cwd(), './src'),
        ...localModules,
      },
    },
    output: {
      assetModuleFilename: 'assets/[hash][ext][query]',
      clean: params.cleanOutputDirectory,
    },
    performance: {
      hints: false,
    },
    infrastructureLogging: {
      appendOnly: true,
      level: 'warn',
    },
    stats: 'none',
    plugins: [
      ...(!params.dev ? [new PrintAssetSizesPlugin()] : []),
      ...(params.analyzeBundle ? [
        new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: 'json', reportFilename: './bundle-size.json' }),
        new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: 'static', reportFilename: './bundle-size.html' }),
      ] : []),
    ],
  };
};
