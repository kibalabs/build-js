#!/usr/bin/env node


import commander from 'commander'

import publish from './publish'

const params = commander
  .option('-n, --next')
  .option('-nv, --next-version <number>')
  .parse(process.argv)
  .opts();

publish(params);
