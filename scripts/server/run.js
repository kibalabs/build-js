#!/usr/bin/env node
import commander from 'commander'

import build from './build'

const params = commander
  .option('-c, --config-modifier <path>')
  .option('-d, --dev')
  .option('-s, --start')
  .parse(process.argv)
  .opts();

build(params);
