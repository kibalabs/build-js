import path from 'path';

import chalk from 'chalk';
import glob from 'glob';
import webpackMerge from 'webpack-merge';

import { buildCommonWebpackConfig } from '../common/common.webpack.js';
import { buildJsWebpackConfig } from '../common/js.webpack.js';
import { createCompiler } from '../common/webpackUtil.js';
import { generateTypescriptDeclarations } from '../typing/generateDeclarations';
import { buildTsConfig } from '../typing/ts.config.js';
import { removeUndefinedProperties } from '../util.js';
import { buildModuleWebpackConfig } from './module.webpack.js';


export const buildModule = async (inputParams = {}) => {
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
    name: undefined,
    excludeAllNodeModules: false,
    nodeModulesPaths: undefined,
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.ts'),
    outputDirectory: path.join(process.cwd(), './dist'),
  };
  let params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  if (params.configModifier) {
    const configModifier = (await import(path.join(process.cwd(), params.configModifier))).default;
    params = configModifier(params);
  }
  // NOTE(krishan711): starting modules in dev mode doesn't work yet. Test in everyview console before re-enabling
  params.dev = false;
  process.env.NODE_ENV = params.dev ? 'development' : 'production';

  let mergedConfig = webpackMerge.merge(
    buildCommonWebpackConfig(params),
    buildJsWebpackConfig({ ...params, react: true, preserveModules: true }),
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
      generateTypescriptDeclarations(entryPoints, {
        ...tsConfig.compilerOptions,
        outDir: mergedConfig.output.path,
      });
    }
  };
  const onPostBuild = () => {
    if (params.start) {
      console.log('Run', chalk.cyan(`npm install --no-save --force ${process.cwd()}`), `to use ${mergedConfig.name} live 🖥\n`);
    }
  };
  const compiler = createCompiler(mergedConfig, onBuild, onPostBuild);

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
