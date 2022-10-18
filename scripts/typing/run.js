#!/usr/bin/env node

import commander from 'commander'

import type from './type'

const params = commander
  .option('-cm, --config-modifier <path>')
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .option('-of, --output-file-format [format]')
  .parse(process.argv)
  .opts();

type(params);
