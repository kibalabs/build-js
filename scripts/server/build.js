const path = require('path');
const webpackMerge = require('webpack-merge');
const webpackUtil = require('../common/webpackUtil');

const buildCommonWebpackConfig = require('../common/common.webpack');
const buildJsWebpackConfig = require('../common/js.webpack');
const buildServerWebpackConfig = require('./server.webpack');

const defaultParams = {
  webpackConfigModifier: undefined,
  dev: false,
  analyzeBundle: false,
  start: false
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  process.env.NODE_ENV = params.dev ? 'development' : 'production';

  var mergedConfig = webpackMerge.merge(
    buildCommonWebpackConfig({dev: params.dev, analyze: params.analyzeBundle}),
    buildJsWebpackConfig(),
    buildServerWebpackConfig(),
  );

  if (params.webpackConfigModifier) {
    const webpackConfigModifier = require(path.join(process.cwd(), params.webpackConfigModifier));
    mergedConfig = webpackConfigModifier(mergedConfig);
  }

  const compiler = webpackUtil.createCompiler(mergedConfig, params.start);

  if (params.start) {
    compiler.watch({
      aggregateTimeout: 1000,
      poll: true,
      ignored: ['**/*.d.ts'],
    }, () => {});
  } else {
    compiler.run();
  }
};
