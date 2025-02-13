import dns from 'dns';
import os from 'os';
import path from 'path';

import chalk from 'chalk';
import WebpackDevServer from 'webpack-dev-server';
import webpackMerge from 'webpack-merge';

import { buildReactAppWebpackConfig } from './app.webpack';
import { buildCommonWebpackConfig } from '../common/common.webpack';
import { buildCssWebpackConfig } from '../common/css.webpack';
import { buildImagesWebpackConfig } from '../common/images.webpack';
import { buildJsWebpackConfig } from '../common/js.webpack';
import { open } from '../common/platformUtil';
import { createCompiler } from '../common/webpackUtil';
import { removeUndefinedProperties } from '../util';


export const buildReactApp = async (inputParams = {}) => {
  const defaultParams = {
    dev: false,
    start: false,
    port: 3000,
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
    const configModifier = (await import(path.join(process.cwd(), params.configModifier))).default;
    if (configModifier.constructor.name === 'AsyncFunction') {
      params = await configModifier(params);
    } else {
      params = configModifier(params);
    }
  }
  process.env.NODE_ENV = params.dev ? 'development' : 'production';

  let mergedConfig = webpackMerge.merge(
    buildCommonWebpackConfig(params),
    buildJsWebpackConfig({ ...params, react: true }),
    buildCssWebpackConfig(params),
    buildImagesWebpackConfig(params),
    buildReactAppWebpackConfig(params),
  );
  if (params.webpackConfigModifier) {
    mergedConfig = params.webpackConfigModifier(mergedConfig);
  }

  const compiler = createCompiler(mergedConfig, undefined, undefined, true, params.analyzeBundle);
  if (params.start) {
    const host = '0.0.0.0';
    const port = params.port;
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
