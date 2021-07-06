const path = require('path');

const chalk = require('chalk');
const glob = require('glob');
const webpackMerge = require('webpack-merge');


const buildCommonWebpackConfig = require('../common/common.webpack');
const buildCssWebpackConfig = require('../common/css.webpack');
const buildImagesWebpackConfig = require('../common/images.webpack');
const buildJsWebpackConfig = require('../common/js.webpack');
const webpackUtil = require('../common/webpackUtil');
const generateDeclarations = require('../typing/generateDeclarations');
const buildTsConfig = require('../typing/ts.config');
const buildComponentWebpackConfig = require('./component.webpack');


module.exports = (inputParams = {}) => {
  const defaultParams = {
    configModifier: undefined,
    dev: false,
    start: false,
    webpackConfigModifier: undefined,
    analyzeBundle: false,
    polyfill: false,
    multiEntry: null,
    allFiles: false,
    recursive: false,
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
    buildJsWebpackConfig({ ...params, react: true, preserveModules: true }),
    buildCssWebpackConfig(params),
    buildImagesWebpackConfig(params),
    buildComponentWebpackConfig(params),
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
    if (typeof params.webpackConfigModifier === 'function') {
      mergedConfig = params.webpackConfigModifier(mergedConfig);
    } else {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const webpackConfigModifier = require(path.join(process.cwd(), params.webpackConfigModifier));
      mergedConfig = webpackConfigModifier(mergedConfig);
    }
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
