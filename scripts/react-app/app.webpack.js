const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const CreateRuntimeConfigPlugin = require('../plugins/createRuntimeConfigPlugin');

const package = JSON.parse(fs.readFileSync(path.join(process.cwd(), './package.json'), 'utf8'));

module.exports = (config = {}) => ({
  name: package.name,
  entry: [
    'core-js/stable',
    'regenerator-runtime/runtime',
    'whatwg-fetch',
    'react-hot-loader/patch',
    path.join(process.cwd(), './src/index.tsx')
  ],
  target: 'web',
  output: {
    chunkFilename: '[name].[hash:8].bundle.js',
    filename: '[name].[hash:8].js',
    path: path.join(process.cwd(), './dist'),
    publicPath: '/',
    pathinfo: false,
  },
  resolve: {
    alias: {
      'react-dom': '@hot-loader/react-dom',
    }
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
    },
  },
  plugins: [
    new webpack.HashedModuleIdsPlugin(),
    new HtmlWebpackPlugin({
      inject: true,
      template: path.join(__dirname, './index.html'),
    }),
    new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
      PUBLIC_URL: '',
    }),
    new CopyPlugin({
      patterns: [
        { from: path.join(process.cwd(), './public'), noErrorOnMissing: true },
      ]
    }),
    new webpack.DefinePlugin({
      APP_NAME: JSON.stringify(package.name),
      APP_VERSION: JSON.stringify(package.version),
      APP_DESCRIPTION: JSON.stringify(package.description),
    }),
    new CreateRuntimeConfigPlugin({
    }),
  ],
});
