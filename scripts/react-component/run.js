#!/usr/bin/env node
const commander = require('commander');

const build = require('./build');

const params = commander
  .option('-wm, --webpack-config-modifier <path>')
  .option('-me, --multi-entry <name>')
  .option('-d, --dev')
  .option('-r, --recursive') // when using multi-entry go to all depths
  .option('-a, --all-files') // When using multi-entry look at all files not just index
  .option('-s, --start')
  .option('-a, --analyze-bundle')
  .parse(process.argv)
  .opts();

build(params);
