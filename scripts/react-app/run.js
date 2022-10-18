#!/usr/bin/env node
import commander from 'commander'

import { buildReactApp } from './build.js'

const params = commander
  .option('-c, --config-modifier <path>')
  .option('-d, --dev')
  .option('-s, --start')
  .parse(process.argv)
  .opts();

  buildReactApp(params);
