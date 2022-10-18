#!/usr/bin/env node
import { program } from 'commander';

import { buildServer } from './build.js';

const params = program
  .option('-c, --config-modifier <path>')
  .option('-d, --dev')
  .option('-s, --start')
  .parse(process.argv)
  .opts();

buildServer(params);
