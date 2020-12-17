const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const packageUtil = require('../common/packageUtil');

const defaultParams = {
  entryFile: undefined,
  outputPath: undefined,
  dev: false,
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  const package = JSON.parse(fs.readFileSync(path.join(process.cwd(), './package.json'), 'utf8'));
  console.log('Building component with package:', package);
  return {
    name: package.name,
    entry: [
      params.entryFile || path.join(process.cwd(), './src/index.ts'),
    ],
    target: 'node',
    output: {
      filename: '[name].js',
      chunkFilename: '[name].bundle.js',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      path: params.outputPath || path.join(process.cwd(), './dist'),
      library: package.name,
      globalObject: 'this',
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
        if (packageUtil.isExternalPackageRequest(package, request)) {
          return callback(null, 'commonjs ' + request);
        }
        console.log('external', request);
        return callback();
      }
    ],
    // need to set devtool to none otherwise the "require"s for externals
    // don't work when used with an app that is run with start-dev
    devtool: params.dev ? 'none' : 'eval',
  };
}
