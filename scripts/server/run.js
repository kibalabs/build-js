#!/usr/bin/env node
'use strict';

const path = require('path');
const commander = require('commander');
const webpackMerge = require('webpack-merge');
const webpackUtil = require('../common/webpackUtil');

const params = commander
  .option('-wm, --webpack-config-modifier <path>')
  .option('-me, --multi-entry <name>')
  .option('-d, --dev')
  .option('-s, --start')
  .option('-a, --analyze-bundle')
  .parse(process.argv);

process.env.NODE_ENV = params.dev ? 'development' : 'production';

var mergedConfig = webpackMerge.merge(
  require('../common/common.webpack')({analyze: params.analyzeBundle}),
  require('./server.webpack')(),
  params.dev ? require('./dev.webpack')() : require('./prod.webpack')(),
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
