const fs = require('fs');
const path = require('path');

const webpack = require('webpack');

const packageUtil = require('../common/packageUtil');

const defaultParams = {
  dev: false,
  packageFilePath: undefined,
  name: undefined,
  entryFilePath: undefined,
  outputDirectory: undefined,
  excludeAllNodeModules: false,
  nodeModulesPath: undefined,
  // NOTE(krish): allow multiple node_modules paths to cater for lerna
  nodeModulesPaths: undefined,
};

module.exports = (inputParams = {}) => {
  const params = { ...defaultParams, ...inputParams };
  const packageFilePath = params.packageFilePath || path.join(process.cwd(), './package.json');
  const package = JSON.parse(fs.readFileSync(packageFilePath, 'utf8'));
  const entryFilePath = params.entryFilePath || path.join(process.cwd(), './src/index.tsx');
  const outputDirectory = params.outputDirectory || path.join(process.cwd(), './dist');
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
      entryFilePath,
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
      path: outputDirectory,
      library: name,
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          PACKAGE_NAME: JSON.stringify(name),
          PACKAGE_VERSION: JSON.stringify(package.version),
        },
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
