import path from 'node:path';

import { rolldown } from 'rolldown';

import { buildModuleRolldownConfig } from './module.config.js';
import { removeUndefinedProperties, runParamsConfigModifier } from '../util.js';


export const buildModuleRolldown = async (inputParams = {}) => {
  const defaultParams = {
    configModifier: undefined,
    dev: false,
    start: false,
    rolldownConfigModifier: undefined,
    name: undefined,
    excludeAllNodeModules: false,
    nodeModulesPaths: undefined,
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.ts'),
    outputDirectory: path.join(process.cwd(), './dist'),
  };
  let params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  params = await runParamsConfigModifier(params);
  // NOTE(krishan711): starting modules in dev mode doesn't work yet. Test in everyview console before re-enabling
  params.dev = false;
  process.env.NODE_ENV = params.dev ? 'development' : 'production';

  let rolldownConfig = buildModuleRolldownConfig(params);
  if (params.rolldownConfigModifier) {
    rolldownConfig = params.rolldownConfigModifier(rolldownConfig);
  }
  const bundle = await rolldown(rolldownConfig);
  await bundle.write();
  await bundle.close();
};
