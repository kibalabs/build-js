import path from 'node:path';

import { sync } from 'glob';
import { rolldown } from 'rolldown';

import { buildModuleRolldownConfig } from './module.config.js';
import { buildParams } from '../util.js';


const getEntryFilePaths = (params) => {
  if (!params.multiEntry) {
    return [params.entryFilePath];
  }
  const indicesOnly = !params.allFiles;
  const fileNamePattern = indicesOnly ? 'index' : '*';
  const topDirectoryOnly = !params.recursive;
  const directoryPattern = topDirectoryOnly ? '*' : '**';
  return sync(`./${params.multiEntry}/${directoryPattern}/${fileNamePattern}.{js,jsx,ts,tsx}`)
    .sort()
    .map((filePath) => path.resolve(process.cwd(), filePath));
};

const getRolldownInput = (entryFilePaths, multiEntryDirectory) => {
  if (!multiEntryDirectory) {
    return entryFilePaths[0];
  }
  return entryFilePaths.reduce((accumulator, entryFilePath) => {
    const relativePath = path.relative(path.resolve(process.cwd(), multiEntryDirectory), entryFilePath);
    const outputName = relativePath.replace(/\.(j|t)sx?$/, '');
    accumulator[outputName] = entryFilePath;
    return accumulator;
  }, {});
};

export const buildModuleRolldown = async (inputParams = {}) => {
  const defaultParams = {
    configModifier: undefined,
    dev: false,
    multiEntry: null,
    allFiles: false,
    recursive: false,
    start: false,
    rolldownConfigModifier: undefined,
    name: undefined,
    excludeAllNodeModules: false,
    nodeModulesPaths: undefined,
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.ts'),
    outputDirectory: path.join(process.cwd(), './dist'),
    typescriptDeclarationCompilerOptions: undefined,
  };
  const params = await buildParams(defaultParams, inputParams, false);
  if (params.webpackConfigModifier) {
    console.warn('Ignoring webpackConfigModifier for Rolldown builds. Migrate this customization to rolldownConfigModifier.');
  }
  if (params.start) {
    console.warn('Rolldown module watch mode is not implemented yet. Running a one-off build instead.');
  }
  const entryFilePaths = getEntryFilePaths(params);
  let rolldownConfig = buildModuleRolldownConfig({
    ...params,
    entryFilePaths,
    entryFilePath: getRolldownInput(entryFilePaths, params.multiEntry),
  });
  if (params.rolldownConfigModifier) {
    rolldownConfig = params.rolldownConfigModifier(rolldownConfig);
  }
  const bundle = await rolldown(rolldownConfig);
  await bundle.write();
  await bundle.close();
};
