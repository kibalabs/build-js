#!/usr/bin/env node
'use strict';

const commander = require('commander');
const lint = require('lint');

const params = commander
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .option('-f, --fix')
  .parse(process.argv);

lint(params);
