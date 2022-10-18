#!/usr/bin/env node
import { program } from 'commander';

import build from './build.js';

const params = program
  .option('-c, --config-modifier <path>')
  .option('-e, --entry-file-path <path>')
  .option('-b, --app-entry-file-path <path>')
  .option('-a, --build-directory <path>')
  .option('-o, --output-directory <path>')
  .parse(process.argv)
  .opts();

build(params);
