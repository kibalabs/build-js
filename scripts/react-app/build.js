const dns = require('dns');
const os = require('os');
const path = require('path');

const chalk = require('chalk');
const WebpackDevServer = require('webpack-dev-server');
const webpackMerge = require('webpack-merge');

const buildCommonWebpackConfig = require('../common/common.webpack');
const buildCssWebpackConfig = require('../common/css.webpack');
const buildImagesWebpackConfig = require('../common/images.webpack');
const buildJsWebpackConfig = require('../common/js.webpack');
const { open } = require('../common/platformUtil');
const webpackUtil = require('../common/webpackUtil');
const buildAppWebpackConfig = require('./app.webpack');

module.exports = (inputParams = {}) => {
  const defaultParams = {
    configModifier: undefined,
    dev: false,
    start: false,
    webpackConfigModifier: undefined,
    analyzeBundle: false,
    shouldAliasModules: true,
  };

  let params = { ...defaultParams, ...inputParams };
  if (params.configModifier) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const configModifier = require(path.join(process.cwd(), params.configModifier));
    params = configModifier(params);
  }
  process.env.NODE_ENV = params.dev ? 'development' : 'production';

  let mergedConfig = webpackMerge.merge(
    buildCommonWebpackConfig(params),
    buildJsWebpackConfig({ ...params, react: true, polyfill: true }),
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
      static: {
        directory: './',
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
        open(`http://${host}:${port}`, { stdio: 'inherit' });
      }
    });
  } else {
    compiler.run();
  }
};
