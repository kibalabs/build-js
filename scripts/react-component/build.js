const path = require('path');
const chalk = require('chalk');
const glob = require('glob');
const webpackMerge = require('webpack-merge');
const generateDeclarations = require('../typing/generateDeclarations');
const tsConfig = require('../typing/tsconfig');
const webpackUtil = require('../common/webpackUtil');

const buildCommonWebpackConfig = require('../common/common.webpack');
const buildJsWebpackConfig = require('../common/js.webpack');
const buildCssWebpackConfig = require('../common/css.webpack');
const buildImagesWebpackConfig = require('../common/images.webpack');
const buildComponentWebpackConfig = require('./component.webpack');

const defaultParams = {
  webpackConfigModifier: undefined,
  dev: false,
  analyzeBundle: false,
  start: false,
  multiEntry: null,
  allFiles: false,
  recursive: false,
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  process.env.NODE_ENV = params.dev ? 'development' : 'production';

  var mergedConfig = webpackMerge.merge(
    buildCommonWebpackConfig({dev: params.dev, analyze: params.analyzeBundle}),
    buildJsWebpackConfig({polyfill: false, react: true}),
    buildCssWebpackConfig(),
    buildImagesWebpackConfig(),
    buildComponentWebpackConfig({dev: params.dev}),
  );

  if (params.webpackConfigModifier) {
    const webpackConfigModifier = require(path.join(process.cwd(), params.webpackConfigModifier));
    mergedConfig = webpackConfigModifier(mergedConfig);
  }

  if (params.multiEntry) {
    const indicesOnly = !params.allFiles;
    const fileNamePattern = indicesOnly ? 'index' : '*';
    const topDirectoryOnly = !params.recursive;
    const directoryPattern = topDirectoryOnly ? '*' : '**';
    mergedConfig.entry = glob.sync(`./${params.multiEntry}/${directoryPattern}/${fileNamePattern}.{js,jsx,ts,tsx}`).reduce((accumulator, file) => {
      accumulator[file.replace(new RegExp(`^\.\/${params.multiEntry}\/`), '').replace(/\.(j|t)sx?$/, '')] = file;
      return accumulator;
    }, {});
  } else {
    mergedConfig.output.filename = 'index.js';
  }

  const onBuild = () => {
    if (!params.dev) {
      console.log('Generating ts declarations...');
      generateDeclarations(typeof mergedConfig.entry === 'string' ? [mergedConfig.entry] : Object.values(mergedConfig.entry), {
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
  const compiler = webpackUtil.createCompiler(mergedConfig, params.start, onBuild, onPostBuild);

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
