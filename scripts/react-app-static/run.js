#!/usr/bin/env node
const commander = require('commander');

const build = require('./build');

const params = commander
  .option('-c, --config-modifier <path>')
  .option('-d, --directory <path>')
  .option('-b, --build-directory <path>')
  .option('-o, --output-directory <path>')
  .parse(process.argv)
  .opts();

build(params);
