#!/usr/bin/env node
const { program } = require('commander');

const { buildReactComponent } = require('./build');

const params = program
  .option('-c, --config-modifier <path>')
  .option('-d, --dev')
  .option('-s, --start')
  .parse(process.argv)
  .opts();

buildReactComponent(params);
