#!/usr/bin/env node

import { program } from 'commander';

import { runTyping } from './type.js';

const params = program
  .option('-cm, --config-modifier <path>')
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .option('-of, --output-file-format [format]')
  .parse(process.argv)
  .opts();

runTyping(params);
