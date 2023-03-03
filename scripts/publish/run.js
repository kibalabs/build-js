#!/usr/bin/env node

const { program } = require('commander');

const { runPublish } = require('./publish');

const params = program
  .option('-n, --next')
  .option('-nv, --next-version <number>')
  .option('-nt, --next-type <string>')
  .parse(process.argv)
  .opts();

runPublish(params);
