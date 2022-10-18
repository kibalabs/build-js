#!/usr/bin/env node

import { program } from 'commander';

import { runLinting } from './lint.js';

const params = program
  .option('-cm, --config-modifier <path>')
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .option('-of, --output-file-format [format]')
  .option('-f, --fix')
  .parse(process.argv)
  .opts();

runLinting(params);
