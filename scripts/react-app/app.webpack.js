const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const LoadablePlugin = require('@loadable/webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');

const CreateRobotsTxtPlugin = require('../plugins/createRobotsTxtPlugin');
const CreateRuntimeConfigPlugin = require('../plugins/createRuntimeConfigPlugin');

const defaultParams = {
  dev: false,
  packagePath: undefined,
  entryFile: undefined,
  outputPath: undefined,
  addHtmlOutput: true,
  addRuntimeConfig: true,
  runtimeConfigVars: {},
  publicDirectory: undefined,
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  const packagePath = params.packagePath || path.join(process.cwd(), './package.json');
  const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return {
    entry: [
      // NOTE(krishan711): this is needed if babel doesn't transpile the node_modules
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
    },
    resolve: {
      alias: {
        ...(params.dev ? {
          'react-dom': '@hot-loader/react-dom',
        } : {}),
      }
    },
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        name: 'vendor',
        chunks: 'all',
      },
      usedExports: true,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: true,
        }),
      ],
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
          { from: params.publicDirectory || path.join(process.cwd(), './public'), noErrorOnMissing: true },
        ]
      }),
      new webpack.DefinePlugin({
        APP_NAME: JSON.stringify(package.name),
        APP_VERSION: JSON.stringify(package.version),
        APP_DESCRIPTION: JSON.stringify(package.description),
      }),
      new CreateRobotsTxtPlugin(),
      new LoadablePlugin({outputAsset: false, writeToDisk: false}),
      ...(params.addRuntimeConfig ? [new CreateRuntimeConfigPlugin(params.runtimeConfigVars)] : []),
      ...(params.dev ? [new webpack.HotModuleReplacementPlugin()] : [])
    ],
  };
};
