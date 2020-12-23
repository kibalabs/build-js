#!/usr/bin/env node
'use strict';

const commander = require('commander');
const build = require('./build');

const params = commander
  .option('-wm, --webpack-config-modifier <path>')
  .option('-d, --dev')
  .option('-s, --start')
  .option('-a, --analyze-bundle')
  .parse(process.argv);

build(params);
