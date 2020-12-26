#!/usr/bin/env node
'use strict';

const commander = require('commander');
const publish = require('./publish');

const params = commander
  .option('-n, --next')
  .option('-nv, --next-version <number>')
  .parse(process.argv);

publish(params);
