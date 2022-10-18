import dns from 'dns'
import os from 'os'
import path from 'path'

import chalk from 'chalk';
import WebpackDevServer from 'webpack-dev-server'
import webpackMerge from 'webpack-merge'

import buildCommonWebpackConfig from '../common/common.webpack'
import buildCssWebpackConfig from '../common/css.webpack'
import buildImagesWebpackConfig from '../common/images.webpack'
import buildJsWebpackConfig from '../common/js.webpack'
import { open } from '../common/platformUtil'
import webpackUtil from '../common/webpackUtil'
import { removeUndefinedProperties } from '../util'
import buildAppWebpackConfig from './app.webpack'

export const buildReactApp = (inputParams = {}) => {
  const defaultParams = {
    dev: false,
    start: false,
    configModifier: undefined,
    polyfill: true,
    polyfillTargets: undefined,
    webpackConfigModifier: undefined,
    analyzeBundle: false,
    shouldAliasModules: true,
    addHtmlOutput: true,
    addRuntimeConfig: true,
    runtimeConfigVars: {},
    seoTags: [],
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.tsx'),
    outputDirectory: path.join(process.cwd(), './dist'),
    publicDirectory: path.join(process.cwd(), './public'),
  };

  let params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  if (params.configModifier) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const configModifier = require(path.join(process.cwd(), params.configModifier));
    params = configModifier(params);
  }
  process.env.NODE_ENV = params.dev ? 'development' : 'production';

  let mergedConfig = webpackMerge.merge(
    buildCommonWebpackConfig(params),
    buildJsWebpackConfig({ ...params, react: true }),
    buildCssWebpackConfig(params),
    buildImagesWebpackConfig(params),
    buildAppWebpackConfig(params),
  );
  if (params.webpackConfigModifier) {
    mergedConfig = params.webpackConfigModifier(mergedConfig);
  }

  const compiler = webpackUtil.createCompiler(mergedConfig);
  if (params.start) {
    const host = '0.0.0.0';
    const port = 3000;
    const server = new WebpackDevServer({
      host,
      port,
      hot: true,
      historyApiFallback: true,
      devMiddleware: {
        publicPath: mergedConfig.output.publicPath,
      },
      client: {
        logging: 'info',
        overlay: false,
      },
      open: false,
      static: {
        directory: mergedConfig.output.publicPath,
        watch: {
          aggregateTimeout: 1000,
          poll: undefined,
          ignored: ['**/*.d.ts'],
        },
      },
      ...(mergedConfig.devServer || {}),
    }, compiler);
    server.startCallback(() => {
      console.log(chalk.cyan('Starting the development server...\n'));
      if (host === '0.0.0.0') {
        dns.lookup(os.hostname(), (dnsError, address) => {
          console.log(`Use ${mergedConfig.name} at: http://${address}:${port}`);
          open(`http://localhost:${port}`, { stdio: 'inherit' });
        });
      } else {
        console.log(`Use ${mergedConfig.name} at: http://${host}:${port}`);
        open(`http://${host}:${port}`, { stdio: 'inherit' });
      }
    });
  } else {
    compiler.run();
  }
};
