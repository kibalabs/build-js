const path = require('path');
const chalk = require('chalk');
const webpackMerge = require('webpack-merge');
const webpackDevServer = require('webpack-dev-server');
const childProcess = require('child_process');
const webpackUtil = require('../common/webpackUtil');

const buildCommonWebpackConfig = require('../common/common.webpack');
const buildJsWebpackConfig = require('../common/js.webpack');
const buildCssWebpackConfig = require('../common/css.webpack');
const buildImagesWebpackConfig = require('../common/images.webpack');
const buildAppWebpackConfig = require('./app.webpack');

const defaultParams = {
  webpackConfigModifier: undefined,
  dev: false,
  analyzeBundle: false,
  start: false
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  process.env.NODE_ENV = dev ? 'development' : 'production';

  var mergedConfig = webpackMerge.merge(
    buildCommonWebpackConfig({dev: params.dev, analyze: params.analyzeBundle}),
    buildJsWebpackConfig({polyfill: true, react: true}),
    buildCssWebpackConfig(),
    buildImagesWebpackConfig(),
    buildAppWebpackConfig({dev: params.dev}),
  );

  if (params.webpackConfigModifier) {
    const webpackConfigModifier = require(path.join(process.cwd(), params.webpackConfigModifier));
    mergedConfig = webpackConfigModifier(mergedConfig);
  }

  const compiler = webpackUtil.createCompiler(mergedConfig, params.start);

  if (params.start) {
    const host = '0.0.0.0';
    const port = 3000;
    const server = new webpackDevServer(compiler, {
      host,
      port,
      hot: true,
      inline: true,
      quiet: true,
      publicPath: mergedConfig.output.publicPath,
      contentBase: './',
      historyApiFallback: true,
      watchOptions: {
        aggregateTimeout: 1000,
        poll: undefined,
        ignored: ['**/*.d.ts'],
      },
    });
    server.listen(port, host, (err) => {
      if (err) {
        console.log(err);
      }
      console.log(chalk.cyan('Starting the development server...\n'));
      if (host == '0.0.0.0') {
        require('dns').lookup(require('os').hostname(), function (err, address, fam) {
          console.log(`Use ${mergedConfig.name} at: http://${address}:${port}`);
          childProcess.execSync(`open http://localhost:${port}`, { stdio: 'inherit' });
        })
      } else {
        childProcess.execSync(`open http://${host}:${port}`, { stdio: 'inherit' });
      }
    });
  } else {
    compiler.run();
  }
};
