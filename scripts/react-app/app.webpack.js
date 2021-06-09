const fs = require('fs');
const path = require('path');

const LoadablePlugin = require('@loadable/webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

const CreateRobotsTxtPlugin = require('../plugins/createRobotsTxtPlugin');
const CreateRuntimeConfigPlugin = require('../plugins/createRuntimeConfigPlugin');

const defaultParams = {
  dev: false,
  packageFilePath: undefined,
  entryFilePath: undefined,
  outputDirectory: undefined,
  addHtmlOutput: true,
  addRuntimeConfig: true,
  runtimeConfigVars: {},
  publicDirectory: undefined,
};

module.exports = (inputParams = {}) => {
  const params = { ...defaultParams, ...inputParams };
  const packageFilePath = params.packageFilePath || path.join(process.cwd(), './package.json');
  const package = JSON.parse(fs.readFileSync(packageFilePath, 'utf8'));
  const entryFilePath = params.entryFilePath || path.join(process.cwd(), './src/index.tsx');
  const publicDirectory = params.publicDirectory || path.join(process.cwd(), './public');
  const outputDirectory = params.outputDirectory || path.join(process.cwd(), './dist');
  return {
    entry: [
      // NOTE(krishan711): these two are needed when babel is using useBuiltIns: 'entry'
      // 'core-js/stable',
      // 'regenerator-runtime/runtime',
      'whatwg-fetch',
      'react-hot-loader/patch',
      entryFilePath,
    ],
    target: 'web',
    output: {
      filename: '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].bundle.js',
      path: outputDirectory,
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
          template: path.join(__dirname, './index.html'),
        }),
        // new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
        //   PUBLIC_URL: '',
        // }),
      ] : []),
      new CopyPlugin({
        patterns: [
          { from: publicDirectory, noErrorOnMissing: true },
        ],
      }),
      new webpack.DefinePlugin({
        APP_NAME: JSON.stringify(package.name),
        APP_VERSION: JSON.stringify(package.version),
        APP_DESCRIPTION: JSON.stringify(package.description),
        'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
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
