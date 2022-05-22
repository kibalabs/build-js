const fs = require('fs');
const path = require('path');

const webpack = require('webpack');

const packageUtil = require('../common/packageUtil');
const { removeUndefinedProperties } = require('../util');

const defaultParams = {
  dev: undefined,
  name: undefined,
  packageFilePath: undefined,
  entryFilePath: undefined,
  outputDirectory: undefined,
  excludeAllNodeModules: undefined,
  nodeModulesPath: undefined,
  nodeModulesPaths: undefined,
};

module.exports = (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const package = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || package.name;
  const nodeModulesPaths = params.nodeModulesPaths || [params.nodeModulesPath || path.join(process.cwd(), './node_modules')];
  const externalModules = [];
  if (params.excludeAllNodeModules) {
    nodeModulesPaths.forEach((nodeModulesPath) => {
      externalModules.push(...packageUtil.getNodeModules(nodeModulesPath));
    });
  } else {
    externalModules.push(...packageUtil.getExternalModules(package));
  }

  return {
    entry: [
      params.entryFilePath,
    ],
    target: 'node',
    // NOTE(krishan711): apparently this is not needed in webpack5: https://github.com/webpack/webpack/issues/1599
    node: {
      __dirname: false,
      __filename: false,
    },
    output: {
      filename: 'index.js',
      chunkFilename: '[name].bundle.js',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      path: params.outputDirectory,
      library: name,
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.PACKAGE_NAME': JSON.stringify(name),
        'process.env.PACKAGE_VERSION': JSON.stringify(package.version),
      }),
    ],
    externals: [
      ({ request }, callback) => {
        if (packageUtil.isExternalModuleRequest(externalModules, request)) {
          return callback(null, `commonjs ${request}`);
        }
        return callback();
      },
    ],
    devtool: params.dev ? 'source-map' : false,
  };
};
