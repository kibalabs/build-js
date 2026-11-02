import path from 'node:path';

import { sync } from 'glob';
import { rolldown } from 'rolldown';

import { buildModuleRolldownConfig } from './module.config.js';
import { buildParams } from '../util.js';


const getEntryFilePaths = (params) => {
  if (params.entries) {
    return Object.values(params.entries).map((entryFilePath) => path.resolve(process.cwd(), entryFilePath));
  }
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

const getRolldownInput = (params, entryFilePaths) => {
  if (params.entries) {
    // NOTE(krishan711): explicit entries map output names (without extension) to source files,
    // e.g. { index: './src/index.ts', 'react/index': './src/react/index.ts' } builds dist/index.js and dist/react/index.js
    return Object.keys(params.entries).reduce((accumulator, outputName, index) => {
      accumulator[outputName] = entryFilePaths[index];
      return accumulator;
    }, {});
  }
  const multiEntryDirectory = params.multiEntry;
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
    entries: null,
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
  if (params.entries && params.multiEntry) {
    throw new Error('entries and multiEntry cannot be used together');
  }
  const entryFilePaths = getEntryFilePaths(params);
  let rolldownConfig = buildModuleRolldownConfig({
    ...params,
    entryFilePaths,
    entryFilePath: getRolldownInput(params, entryFilePaths),
    // NOTE(krishan711): shared code between explicit entries goes into chunks/ so the entry files keep their names
    entryFileNames: params.entries ? '[name].js' : undefined,
    chunkFileNames: params.entries ? 'chunks/[name]-[hash].js' : undefined,
  });
  if (params.rolldownConfigModifier) {
    rolldownConfig = params.rolldownConfigModifier(rolldownConfig);
  }
  const { output, ...inputOptions } = rolldownConfig;
  const bundle = await rolldown(inputOptions);
  await bundle.write(output);
  await bundle.close();
};
