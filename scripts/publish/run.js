#!/usr/bin/env node

import { program } from 'commander';

import { runPublish } from './publish.js';

const params = program
  .option('-n, --next')
  .option('-nv, --next-version <number>')
  .option('-nt, --next-type <string>')
  .parse(process.argv)
  .opts();

runPublish(params);
