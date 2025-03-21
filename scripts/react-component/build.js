import path from 'node:path';

import chalk from 'chalk';
import { sync } from 'glob';
import { merge as webpackMerge } from 'webpack-merge';

import { buildCommonWebpackConfig } from '../common/common.webpack.js';
import { buildCssWebpackConfig } from '../common/css.webpack.js';
import { buildImagesWebpackConfig } from '../common/images.webpack.js';
import { buildJsWebpackConfig } from '../common/js.webpack.js';
import { createCompiler } from '../common/webpackUtil.js';
import { buildModuleWebpackConfig } from '../module/module.webpack.js';
import { generateTypescriptDeclarations } from '../typing/generateDeclarations.js';
import { buildTsConfig } from '../typing/ts.config.js';
import { removeUndefinedProperties } from '../util.js';

export const buildReactComponent = async (inputParams = {}) => {
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
    const configModifier = (await import(path.join(process.cwd(), params.configModifier))).default;
    if (configModifier.constructor.name === 'AsyncFunction') {
      params = await configModifier(params);
    } else {
      params = configModifier(params);
    }
  }
  process.env.NODE_ENV = params.dev ? 'development' : 'production';

  let mergedConfig = webpackMerge(
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
    mergedConfig.entry = sync(`./${params.multiEntry}/${directoryPattern}/${fileNamePattern}.{js,jsx,ts,tsx}`).reduce((accumulator, file) => {
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
        jsx: 'react',
      });
    }
  };
  const onPostBuild = () => {
    if (params.start) {
      console.log('Run', chalk.cyan(`npm install --no-save --force ${process.cwd()}`), `to use ${mergedConfig.name} live 🖥\n`);
    }
  };
  const compiler = createCompiler(mergedConfig, onBuild, onPostBuild, true, params.analyzeBundle);

  if (params.start) {
    compiler.watch({
      aggregateTimeout: 1000,
      poll: true,
      ignored: ['**/*.d.ts'],
      // }, (e, s) => {console.log('here', e, s.toJson({ all: false, warnings: true, errors: true }))});
    }, () => {});
  } else {
    compiler.run();
  }
};
