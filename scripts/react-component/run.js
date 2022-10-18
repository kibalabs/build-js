#!/usr/bin/env node
import { program } from 'commander';

import { buildReactComponent } from './build.js';

const params = program
  .option('-c, --config-modifier <path>')
  .option('-d, --dev')
  .option('-s, --start')
  .parse(process.argv)
  .opts();

buildReactComponent(params);
