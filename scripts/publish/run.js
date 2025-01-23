#!/usr/bin/env node

const { program } = require('commander');

const { runPublish } = require('./publish');

const params = program
  .option('-n, --next')
  .option('-v, --next-version <number>')
  .option('-t, --next-type <string>')
  .parse(process.argv)
  .opts();

runPublish(params);
