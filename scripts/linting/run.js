#!/usr/bin/env node
import { program } from 'commander';

import { runLinting } from './lint.js';

const params = program
  .option('-e, --engine <engine>', "Lint engine to use, either 'eslint' or 'oxlint'", 'eslint')
  .option('-c, --config-modifier <path>')
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .option('-r, --output-file-format [format]')
  .option('-f, --fix')
  .option('-s, --skip-stylelint')
  .parse(process.argv)
  .opts();

runLinting(params);
