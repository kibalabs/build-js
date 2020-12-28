#!/usr/bin/env node

const commander = require('commander');

const type = require('./type');

const params = commander
  .option('-cm, --config-modifier <path>')
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .option('-of, --output-file-format [format]')
  .parse(process.argv);

type(params);
