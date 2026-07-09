#!/usr/bin/env node
import { program } from 'commander';

import { buildReactApp } from './build.js';

const params = program
  .option('-c, --config-modifier <path>')
  .option('-s, --start')
  .parse(process.argv)
  .opts();

buildReactApp(params);
