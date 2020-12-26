#!/usr/bin/env node

const commander = require('commander');

const type = require('./type');

const params = commander
  .option('-cm, --config-modifier <path>')
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .parse(process.argv);


type(params);
