const fs = require('fs');
const path = require('path');

const LoadablePlugin = require('@loadable/webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

const CreateRobotsTxtPlugin = require('../plugins/createRobotsTxtPlugin');
const CreateRuntimeConfigPlugin = require('../plugins/createRuntimeConfigPlugin');
const InjectSeoPlugin = require('../plugins/injectSeoPlugin');

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
    seoTags: [],
    title: undefined,
    publicDirectory: path.join(process.cwd(), './public'),
  };
  const params = { ...defaultParams, ...inputParams };
  const package = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || package.name;

  const runtimeConfigVars = params.runtimeConfigVars;
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('KRT_')) {
      runtimeConfigVars[key] = process.env[key];
    }
  });

  return {
    entry: [
      'whatwg-fetch',
      // NOTE(krishan711): these two are needed when babel is using useBuiltIns: 'entry'
      // 'core-js/stable',
      // 'regenerator-runtime/runtime',
      params.entryFilePath,
    ],
    target: 'web',
    output: {
      filename: '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].bundle.js',
      path: params.outputDirectory,
      publicPath: '/',
    },
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            chunks: "all",
            minSize: 50 * 1024,
            name: (module, _, cacheGroupKey) => {
              const moduleContextParts = module.context.match(/[\\/]node_modules[\\/](.*)/);
              const modulePathParts = moduleContextParts[1].split('/');
              const packageName = modulePathParts.length > 1 && modulePathParts[0].startsWith('@') ? `${modulePathParts[0]}-${modulePathParts[1]}` : modulePathParts[0];
              return `${cacheGroupKey}-${packageName.replace('@', '')}`;
            },
          },
          vendorSmall: {
            test: /[\\/]node_modules[\\/]/,
            chunks: "all",
            name: 'vendor-small',
          },
        }
      },
      moduleIds: 'deterministic',
      usedExports: true,
      minimize: !params.dev,
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
      ...(params.seoTags || params.title ? [new InjectSeoPlugin(params.title || name, params.seoTags)] : []),
      ...(params.addRuntimeConfig ? [new CreateRuntimeConfigPlugin(runtimeConfigVars)] : []),
      ...(params.dev ? [new ReactRefreshWebpackPlugin({ overlay: false })] : []),
    ],
  };
};
