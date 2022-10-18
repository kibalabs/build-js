#!/usr/bin/env node
import commander from 'commander'

import build from './build'

const params = commander
  .option('-wm, --webpack-config-modifier <path>')
  .option('-me, --multi-entry <name>')
  .option('-d, --dev')
  .option('-r, --recursive') // when using multi-entry go to all depths
  .option('-a, --all-files') // When using multi-entry look at all files not just index
  .option('-s, --start')
  .option('-e, --standalone') // TODO(krish): think of a better name - this implies the dependencies are added but they aren't (it just polyfills)
  .option('-a, --analyze-bundle')
  .parse(process.argv)
  .opts();

build(params);
