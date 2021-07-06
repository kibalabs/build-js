const path = require('path');

const webpackMerge = require('webpack-merge');


const buildCommonWebpackConfig = require('../common/common.webpack');
const buildJsWebpackConfig = require('../common/js.webpack');
const webpackUtil = require('../common/webpackUtil');
const buildServerWebpackConfig = require('./server.webpack');

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
    const configModifier = require(path.join(process.cwd(), params.configModifier));
    params = configModifier(params);
  }
  process.env.NODE_ENV = params.dev ? 'development' : 'production';

  let mergedConfig = webpackMerge.merge(
    buildCommonWebpackConfig(params),
    buildJsWebpackConfig(params),
    buildServerWebpackConfig(params),
  );

  if (params.webpackConfigModifier) {
    if (typeof params.webpackConfigModifier === 'function') {
      mergedConfig = params.webpackConfigModifier(mergedConfig);
    } else {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const webpackConfigModifier = require(path.join(process.cwd(), params.webpackConfigModifier));
      mergedConfig = webpackConfigModifier(mergedConfig);
    }
  }

  const compiler = webpackUtil.createCompiler(mergedConfig);

  // TODO(krishan711): Start doesn't seem to work!
  if (params.start) {
    compiler.watch({
      aggregateTimeout: 1000,
      poll: true,
      ignored: ['**/*.d.ts'],
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    }, () => {});
  } else {
    compiler.run();
  }
};
