#!/usr/bin/env node

const { program } = require('commander');

const { runLinting } = require('./lint');

const params = program
  .option('-c, --config-modifier <path>')
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .option('-r, --output-file-format [format]')
  .option('-f, --fix')
  .parse(process.argv)
  .opts();

runLinting(params);
