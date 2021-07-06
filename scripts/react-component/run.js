#!/usr/bin/env node
const commander = require('commander');

const build = require('./build');

const params = commander
  .option('-c, --config-modifier <path>')
  .option('-d, --dev')
  .option('-s, --start')
  .parse(process.argv)
  .opts();

build(params);
