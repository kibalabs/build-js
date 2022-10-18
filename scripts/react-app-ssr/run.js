#!/usr/bin/env node
import commander from 'commander'

import build from './build'

const params = commander
  .option('-c, --config-modifier <path>')
  .option('-e, --entry-file-path <path>')
  .option('-b, --app-entry-file-path <path>')
  .option('-b, --build-directory <path>')
  .option('-o, --output-directory <path>')
  .parse(process.argv)
  .opts();

build(params);
