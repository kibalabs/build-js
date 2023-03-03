const fs = require('fs');
const path = require('path');

const webpack = require('webpack');

const { getExternalModules, getNodeModules, isExternalModuleRequest } = require('../common/packageUtil');
const { removeUndefinedProperties } = require('../util');

const defaultParams = {
  dev: undefined,
  packageFilePath: undefined,
  name: undefined,
  entryFilePath: undefined,
  outputDirectory: undefined,
  excludeAllNodeModules: undefined,
  nodeModulesPath: undefined,
  nodeModulesPaths: undefined,
  outputFilename: 'index.js',
};

const buildModuleWebpackConfig = (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || packageData.name;
  const externalModules = [];
  if (params.excludeAllNodeModules) {
    const nodeModulesPaths = params.nodeModulesPaths || [params.nodeModulesPath || path.join(process.cwd(), './node_modules')];
    nodeModulesPaths.forEach((nodeModulesPath) => {
      externalModules.push(...getNodeModules(nodeModulesPath));
    });
  } else {
    externalModules.push(...getExternalModules(packageData));
  }

  return {
    entry: [
      params.entryFilePath,
    ],
    target: 'node',
    output: {
      filename: params.outputFilename,
      umdNamedDefine: true,
      path: params.outputDirectory,
      chunkFilename: '[name].bundle.js',
      library: name,
      libraryTarget: 'umd',
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.PACKAGE_NAME': JSON.stringify(name),
        'process.env.PACKAGE_VERSION': JSON.stringify(packageData.version),
      }),
    ],
    externals: [
      ({ request }, callback) => {
        if (isExternalModuleRequest(externalModules, request)) {
          return callback(null, `commonjs ${request}`);
        }
        return callback();
      },
    ],
    devtool: params.dev ? 'source-map' : false,
  };
};

module.exports = {
  buildModuleWebpackConfig,
};
