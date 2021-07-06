const fs = require('fs');
const path = require('path');

const LoadablePlugin = require('@loadable/webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

const CreateRobotsTxtPlugin = require('../plugins/createRobotsTxtPlugin');
const CreateRuntimeConfigPlugin = require('../plugins/createRuntimeConfigPlugin');

module.exports = (inputParams = {}) => {
  const defaultParams = {
    dev: false,
    packageFilePath: path.join(process.cwd(), './package.json'),
    name: undefined,
    entryFilePath: path.join(process.cwd(), './src/index.tsx'),
    outputDirectory: path.join(process.cwd(), './dist'),
    addHtmlOutput: true,
    addRuntimeConfig: true,
    runtimeConfigVars: {},
    publicDirectory: path.join(process.cwd(), './public'),
  };
  const params = { ...defaultParams, ...inputParams };
  const package = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || package.name;

  return {
    entry: [
      // NOTE(krishan711): these two are needed when babel is using useBuiltIns: 'entry'
      // 'core-js/stable',
      // 'regenerator-runtime/runtime',
      'whatwg-fetch',
      'react-hot-loader/patch',
      params.entryFilePath,
    ],
    target: 'web',
    output: {
      filename: '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].bundle.js',
      path: params.outputDirectory,
      publicPath: '/',
    },
    resolve: {
      alias: {
        ...(params.dev ? {
          'react-dom': '@hot-loader/react-dom',
        } : {}),
      },
    },
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        name: 'vendor',
        chunks: 'all',
      },
      moduleIds: 'deterministic',
      usedExports: true,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: true,
        }),
      ],
    },
    plugins: [
      ...(params.addHtmlOutput ? [
        new HtmlWebpackPlugin({
          inject: true,
          title: name,
          template: path.join(__dirname, './index.html'),
        }),
      ] : []),
      new CopyPlugin({
        patterns: [
          { from: params.publicDirectory, noErrorOnMissing: true },
        ],
      }),
      new webpack.DefinePlugin({
        APP_NAME: JSON.stringify(package.name),
        APP_VERSION: JSON.stringify(package.version),
        APP_DESCRIPTION: JSON.stringify(package.description),
        'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      }),
      new CreateRobotsTxtPlugin(),
      new LoadablePlugin({ outputAsset: false, writeToDisk: false }),
      ...(params.addRuntimeConfig ? [new CreateRuntimeConfigPlugin(params.runtimeConfigVars)] : []),
      ...(params.dev ? [
        new webpack.HotModuleReplacementPlugin(),
      ] : []),
    ],
  };
};
