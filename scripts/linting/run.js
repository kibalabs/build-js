#!/usr/bin/env node

import commander from 'commander'

import lint from './lint'

const params = commander
  .option('-cm, --config-modifier <path>')
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .option('-of, --output-file-format [format]')
  .option('-f, --fix')
  .parse(process.argv)
  .opts();

lint(params);
