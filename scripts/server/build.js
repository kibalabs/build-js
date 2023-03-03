const path = require('path');

const webpackMerge = require('webpack-merge');

const { buildCommonWebpackConfig } = require('../common/common.webpack');
const { buildJsWebpackConfig } = require('../common/js.webpack');
const { createCompiler } = require('../common/webpackUtil');
const { buildModuleWebpackConfig } = require('../module/module.webpack');
const { removeUndefinedProperties } = require('../util');

const buildServer = async (inputParams = {}) => {
  const defaultParams = {
    configModifier: undefined,
    dev: false,
    start: false,
    webpackConfigModifier: undefined,
    analyzeBundle: false,
    shouldAliasModules: true,
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.ts'),
    outputDirectory: path.join(process.cwd(), './dist'),
  };
  let params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  if (params.configModifier) {
    const configModifier = (await import(path.join(process.cwd(), params.configModifier))).default;
    params = configModifier(params);
  }
  process.env.NODE_ENV = params.dev ? 'development' : 'production';

  let mergedConfig = webpackMerge.merge(
    buildCommonWebpackConfig(params),
    buildJsWebpackConfig(params),
    buildModuleWebpackConfig(params),
  );
  if (params.webpackConfigModifier) {
    mergedConfig = params.webpackConfigModifier(mergedConfig);
  }

  const compiler = createCompiler(mergedConfig, undefined, undefined, true, params.analyzeBundle);

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

module.exports = {
  buildServer,
};
