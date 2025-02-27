import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

import LoadablePlugin from '@loadable/webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

import { CreateRobotsTxtPlugin } from '../plugins/createRobotsTxtPlugin.js';
import { CreateRuntimeConfigPlugin } from '../plugins/createRuntimeConfigPlugin.js';
import { InjectSeoPlugin } from '../plugins/injectSeoPlugin.js';
import { removeUndefinedProperties } from '../util.js';


const defaultParams = {
  dev: undefined,
  name: undefined,
  addHtmlOutput: undefined,
  addRuntimeConfig: undefined,
  runtimeConfigVars: undefined,
  seoTags: undefined,
  title: undefined,
  packageFilePath: undefined,
  entryFilePath: undefined,
  outputDirectory: undefined,
  publicDirectory: undefined,
};

export const buildReactAppWebpackConfig = (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || packageData.name;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const htmlTemplateFilePath = path.join(__dirname, './index.html');

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
    resolve: {
      fallback: {
        path: 'path-browserify',
      },
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
            chunks: 'all',
            minSize: 50 * 1024,
            name: (module, _, cacheGroupKey) => {
              const moduleContextParts = module.context.match(/[\\/]node_modules[\\/](.*)/);
              // TODO(krishan711): not sure why but when running in everypage a file with
              // type:css/mini-extract is being sent here and doesnt have node_modules in the context.
              if (!moduleContextParts) {
                return module.type;
              }
              const modulePathParts = moduleContextParts[1].split('/');
              const packageName = modulePathParts.length > 1 && modulePathParts[0].startsWith('@') ? `${modulePathParts[0]}-${modulePathParts[1]}` : modulePathParts[0];
              return `${cacheGroupKey}-${packageName.replace('@', '')}`;
            },
          },
          vendorSmall: {
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            name: 'vendor-small',
          },
        },
      },
      moduleIds: 'deterministic',
      usedExports: true,
    },
    plugins: [
      ...(params.addHtmlOutput ? [
        new HtmlWebpackPlugin({
          inject: true,
          title: name,
          template: htmlTemplateFilePath,
        }),
      ] : []),
      new CopyPlugin({
        patterns: [
          { from: params.publicDirectory, noErrorOnMissing: true },
        ],
      }),
      new webpack.DefinePlugin({
        APP_NAME: JSON.stringify(packageData.name),
        APP_VERSION: JSON.stringify(packageData.version),
        APP_DESCRIPTION: JSON.stringify(packageData.description),
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
