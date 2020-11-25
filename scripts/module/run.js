#!/usr/bin/env node
'use strict';

const path = require('path');
const chalk = require('chalk');
const glob = require('glob');
const commander = require('commander');
const webpackMerge = require('webpack-merge');
const generateDeclarations = require('../typing/generateDeclarations');
const tsConfig = require('../typing/tsconfig');
const webpackUtil = require('../common/webpackUtil');

const params = commander
  .option('-wm, --webpack-config-modifier <path>')
  .option('-me, --multi-entry <name>')
  .option('-d, --dev')
  .option('-r, --recursive') // when using multi-entry go to all depths
  .option('-a, --all-files') // When using multi-entry look at all files not just index
  .option('-s, --start')
  .option('-e, --standalone') // TODO(krish): think of a better name - this implies the dependencies are added but they aren't (it just polyfills)
  .option('-a, --analyze-bundle')
  .parse(process.argv);

// NOTE(krishan711): starting modules in dev mode doesnt work yet. Test in everyview console before re-enabling
params.dev = false;
process.env.NODE_ENV = params.dev ? 'development' : 'production';

var mergedConfig = webpackMerge.merge(
  require('../common/common.webpack')({analyze: params.analyzeBundle}),
  require('../common/js.webpack')({polyfill: params.standalone}),
  require('./module.webpack')(),
  params.dev ? require('./dev.webpack')() : require('./prod.webpack')(),
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
  }, () => {});
} else {
  compiler.run();
}
