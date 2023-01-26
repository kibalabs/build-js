import fs from 'fs';
import path from 'path';

import TerserPlugin from 'terser-webpack-plugin';
import webpackBundleAnalyzer from 'webpack-bundle-analyzer';

import { getExternalModules } from './packageUtil.js';
import { PrintAssetSizesPlugin } from '../plugins/printAssetSizesPlugin.js';
import { removeUndefinedProperties } from '../util.js';
// import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'

const defaultParams = {
  dev: false,
  analyzeBundle: false,
  packageFilePath: undefined,
  shouldAliasModules: true,
  cleanOutputDirectory: true,
  name: undefined,
};

export const buildCommonWebpackConfig = (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const modules = getExternalModules(packageData);
  // NOTE(krishan711): this aliases all the modules declared in package.json to the one installed in node_modules
  // which makes it much simpler to use locally installed packages with common dependencies (e.g. react, react-dom)
  const localModules = params.shouldAliasModules ? (modules.reduce((accumulator, moduleName) => {
    accumulator[moduleName] = path.resolve(path.join(process.cwd(), './node_modules'), moduleName);
    return accumulator;
  }, {})) : {};
  return {
    name: params.name || packageData.name,
    mode: params.dev ? 'development' : 'production',
    resolve: {
      fallback: {
        fs: false,
        net: false,
        tls: false,
      },
      alias: {
        '@src': path.join(process.cwd(), './src'),
        ...localModules,
      },
    },
    output: {
      assetModuleFilename: 'assets/[hash][ext][query]',
      clean: params.cleanOutputDirectory,
    },
    performance: {
      hints: false,
    },
    infrastructureLogging: {
      appendOnly: true,
      level: 'warn',
    },
    optimization: {
      minimize: !params.dev,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            keep_classnames: !params.dev,
            keep_fnames: !params.dev,
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        }),
        // new CssMinimizerPlugin(),
      ],
    },
    stats: 'none',
    plugins: [
      ...(!params.dev ? [new PrintAssetSizesPlugin()] : []),
      ...(params.analyzeBundle ? [
        new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: 'json', reportFilename: './bundle-size.json' }),
        new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: 'static', reportFilename: './bundle-size.html' }),
      ] : []),
    ],
  };
};
