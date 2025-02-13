#!/usr/bin/env node

import { program } from 'commander';

import { runPublish } from './publish.js';

const params = program
  .option('-n, --next')
  .option('-v, --next-version <number>')
  .option('-t, --next-type <string>')
  .parse(process.argv)
  .opts();

runPublish(params);
