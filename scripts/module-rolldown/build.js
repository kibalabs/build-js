import path from 'node:path';

import { rolldown } from 'rolldown';

import { buildModuleRolldownConfig } from './module.config.js';
import { buildParams } from '../util.js';


export const buildModuleRolldown = async (inputParams = {}) => {
  const defaultParams = {
    configModifier: undefined,
    start: false,
    rolldownConfigModifier: undefined,
    name: undefined,
    excludeAllNodeModules: false,
    nodeModulesPaths: undefined,
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.ts'),
    outputDirectory: path.join(process.cwd(), './dist'),
  };
  const params = await buildParams(defaultParams, inputParams);
  if (params.dev) {
    throw new Error('Dev mode not supported yet');
  }

  let rolldownConfig = buildModuleRolldownConfig(params);
  if (params.rolldownConfigModifier) {
    rolldownConfig = params.rolldownConfigModifier(rolldownConfig);
  }
  const bundle = await rolldown(rolldownConfig);
  await bundle.write();
  await bundle.close();
};
