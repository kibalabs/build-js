import path from 'node:path';

import { buildModuleRolldown } from '../module-rolldown/build.js';


export const buildModule = async (inputParams = {}) => {
  return buildModuleRolldown({
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.ts'),
    outputDirectory: path.join(process.cwd(), './dist'),
    ...inputParams,
  });
};
