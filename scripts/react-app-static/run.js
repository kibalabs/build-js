#!/usr/bin/env node
import { program } from 'commander';

import { buildStaticReactApp } from './build.js';

const params = program
  .option('-c, --config-modifier <path>')
  .option('-e, --entry-file-path <path>')
  .option('-a, --app-entry-file-path <path>')
  .option('-b, --build-directory <path>')
  .option('-o, --output-directory <path>')
  .parse(process.argv)
  .opts();

buildStaticReactApp(params);
