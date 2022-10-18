#!/usr/bin/env node
import { program } from 'commander';

import { buildSsrReactApp } from './build.js';

const params = program
  .option('-c, --config-modifier <path>')
  .option('-e, --entry-file-path <path>')
  .option('-b, --app-entry-file-path <path>')
  .option('-b, --build-directory <path>')
  .option('-o, --output-directory <path>')
  .parse(process.argv)
  .opts();

buildSsrReactApp(params);
