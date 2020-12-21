const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const packageUtil = require('../common/packageUtil');

const defaultParams = {
  dev: false,
  packagePath: undefined,
  entryFile: undefined,
  outputPath: undefined,
  excludeAllNodeModules: false,
  nodeModulesPath: undefined,
  // NOTE(krish): allow multiple node_modules paths to cater for lerna
  nodeModulesPaths: undefined,
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  const packagePath = params.packagePath || path.join(process.cwd(), './package.json');
  const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const nodeModulesPaths = params.nodeModulesPaths ? params.nodeModulesPaths : (params.nodeModulesPath ? [params.nodeModulesPath] : [path.join(process.cwd(), './node_modules')]);
  const externalModules = [];
  if (params.excludeAllNodeModules) {
    nodeModulesPaths.forEach(nodeModulesPath => {
      externalModules.push(...packageUtil.getNodeModules(nodeModulesPath));
    });
  } else {
    externalModules.push(...packageUtil.getExternalModules(package));
  }
  return {
    entry: [
      params.entryFile || path.join(process.cwd(), './src/index.ts'),
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
      path: params.outputPath || path.join(process.cwd(), './dist'),
      library: package.name,
      pathinfo: false,
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          PACKAGE_NAME: JSON.stringify(package.name),
          PACKAGE_VERSION: JSON.stringify(package.version),
        }
      })
    ],
    externals: [
      function(context, request, callback) {
        if (packageUtil.isExternalModuleRequest(externalModules, request)) {
          return callback(null, 'commonjs ' + request);
        }
        return callback();
      }
    ],
  };
}
