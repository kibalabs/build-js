const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const CreateRuntimeConfigPlugin = require('../plugins/createRuntimeConfigPlugin');

const defaultParams = {
  entryFile: undefined,
  outputPath: undefined,
  addHtmlOutput: true,
  addRuntimeConfig: true,
  dev: false,
  runtimeConfigVars: {},
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  const package = JSON.parse(fs.readFileSync(path.join(process.cwd(), './package.json'), 'utf8'));
  return {
    name: package.name,
    entry: [
      'core-js/stable',
      'regenerator-runtime/runtime',
      'whatwg-fetch',
      'react-hot-loader/patch',
      params.entryFile || path.join(process.cwd(), './src/index.tsx'),
    ],
    target: 'web',
    output: {
      filename: '[name].[hash:8].js',
      chunkFilename: '[name].[hash:8].bundle.js',
      path: params.outputPath || path.join(process.cwd(), './dist'),
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
      ...(params.addHtmlOutput ? [
        new HtmlWebpackPlugin({
          inject: true,
          template: path.join(__dirname, './index.html'),
        }),
        new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
          PUBLIC_URL: '',
        }),
      ] : []),
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
      ...(params.addRuntimeConfig ? [
        new CreateRuntimeConfigPlugin(params.runtimeConfigVars)
      ] : []),
      ...(params.dev ? [
        new webpack.HotModuleReplacementPlugin(),
      ] : [])
    ],
  };
};
