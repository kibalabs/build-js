#!/usr/bin/env node


const commander = require('commander');

const lint = require('./lint');

const params = commander
  .option('-cm, --config-modifier <path>')
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .option('-of, --output-file-format [format]')
  .option('-f, --fix')
  .parse(process.argv)
  .opts();

lint(params);
