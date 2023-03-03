#!/usr/bin/env node

const { program } = require('commander');

const { runLinting } = require('./lint');

const params = program
  .option('-cm, --config-modifier <path>')
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .option('-of, --output-file-format [format]')
  .option('-f, --fix')
  .parse(process.argv)
  .opts();

runLinting(params);
