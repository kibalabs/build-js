#!/usr/bin/env node
import { program } from 'commander';

import { runTyping } from './type';

const params = program
  .option('-c, --config-modifier <path>')
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .option('-f, --output-file-format [format]')
  .parse(process.argv)
  .opts();

runTyping(params);
