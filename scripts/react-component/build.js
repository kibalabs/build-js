import path from 'path'

import chalk from 'chalk'
import glob from 'glob'
import webpackMerge from 'webpack-merge'

import buildCommonWebpackConfig from '../common/common.webpack'
import buildCssWebpackConfig from '../common/css.webpack'
import buildImagesWebpackConfig from '../common/images.webpack'
import buildJsWebpackConfig from '../common/js.webpack'
import webpackUtil from '../common/webpackUtil'
import buildModuleWebpackConfig from '../module/module.webpack'
import generateDeclarations from '../typing/generateDeclarations'
import buildTsConfig from '../typing/ts.config'
import { removeUndefinedProperties } from '../util'

module.exports = (inputParams = {}) => {
  const defaultParams = {
    configModifier: undefined,
    dev: false,
    start: false,
    webpackConfigModifier: undefined,
    analyzeBundle: false,
    polyfill: false,
    polyfillTargets: undefined,
    multiEntry: null,
    allFiles: false,
    recursive: false,
    shouldAliasModules: true,
    excludeAllNodeModules: false,
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.ts'),
    outputDirectory: path.join(process.cwd(), './dist'),
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
    buildJsWebpackConfig({ ...params, react: true, preserveModules: true }),
    buildCssWebpackConfig(params),
    buildImagesWebpackConfig(params),
    buildModuleWebpackConfig(params),
  );

  if (params.multiEntry) {
    const indicesOnly = !params.allFiles;
    const fileNamePattern = indicesOnly ? 'index' : '*';
    const topDirectoryOnly = !params.recursive;
    const directoryPattern = topDirectoryOnly ? '*' : '**';
    mergedConfig.entry = glob.sync(`./${params.multiEntry}/${directoryPattern}/${fileNamePattern}.{js,jsx,ts,tsx}`).reduce((accumulator, file) => {
      accumulator[file.replace(new RegExp(`^./${params.multiEntry}/`), '').replace(/\.(j|t)sx?$/, '')] = file;
      return accumulator;
    }, {});
  }
  if (params.webpackConfigModifier) {
    mergedConfig = params.webpackConfigModifier(mergedConfig);
  }

  const tsConfig = buildTsConfig({});

  const onBuild = () => {
    if (!params.dev) {
      const entryPoints = typeof mergedConfig.entry === 'string' ? [mergedConfig.entry] : Object.values(mergedConfig.entry).flat();
      generateDeclarations(entryPoints, {
        ...tsConfig.compilerOptions,
        outDir: mergedConfig.output.path,
        jsx: 'react',
      });
    }
  };
  const onPostBuild = () => {
    if (params.start) {
      console.log('Run', chalk.cyan(`npm install --no-save --force ${process.cwd()}`), `to use ${mergedConfig.name} live 🖥\n`);
    }
  };
  const compiler = webpackUtil.createCompiler(mergedConfig, onBuild, onPostBuild);

  if (params.start) {
    compiler.watch({
      aggregateTimeout: 1000,
      poll: true,
      ignored: ['**/*.d.ts'],
    // }, (e, s) => {console.log('here', e, s.toJson({ all: false, warnings: true, errors: true }))});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    }, () => {});
  } else {
    compiler.run();
  }
};
