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
  outputFilename: 'index.js',
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
    output: {
      filename: params.outputFilename,
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
