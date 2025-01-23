#!/usr/bin/env node
const { program } = require('commander');

const { buildModuleRolldown } = require('./build');

const params = program
  .option('-d, --dev')
  .option('-s, --start')
  .parse(process.argv)
  .opts();

buildModuleRolldown(params);
