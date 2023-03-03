#!/usr/bin/env node

const { program } = require('commander');

const { runTyping } = require('./type');

const params = program
  .option('-cm, --config-modifier <path>')
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .option('-of, --output-file-format [format]')
  .parse(process.argv)
  .opts();

runTyping(params);
