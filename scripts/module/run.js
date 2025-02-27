#!/usr/bin/env node
import { program } from 'commander';

import { buildModule } from './build.js';

const params = program
  .option('-c, --config-modifier <path>')
  .option('-e, --multi-entry <name>')
  .option('-d, --dev')
  .option('-r, --recursive') // when using multi-entry go to all depths
  .option('-a, --all-files') // When using multi-entry look at all files not just index
  .option('-s, --start')
  .option('-t, --standalone') // TODO(krish): think of a better name - this implies the dependencies are added but they aren't (it just polyfills)
  .option('-b, --analyze-bundle')
  .parse(process.argv)
  .opts();

buildModule(params);
