const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const packageUtil = require('../common/packageUtil');

const package = JSON.parse(fs.readFileSync(path.join(process.cwd(), './package.json'), 'utf8'));

module.exports = (config = {}) => ({
  name: package.name,
  entry: path.join(process.cwd(), './src/index.ts'),
  target: 'node',
  output: {
    chunkFilename: '[name].bundle.js',
    filename: '[name].js',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    path: path.join(process.cwd(), './dist'),
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
      return callback();
    }
  ],
});
