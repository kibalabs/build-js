import path from 'path';

import webpackMerge from 'webpack-merge';

import { buildCommonWebpackConfig } from '../common/common.webpack.js';
import { buildJsWebpackConfig } from '../common/js.webpack.js';
import { createCompiler } from '../common/webpackUtil.js';
import { buildModuleWebpackConfig } from '../module/module.webpack.js';
import { removeUndefinedProperties } from '../util.js';

export const buildServer = async (inputParams = {}) => {
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
