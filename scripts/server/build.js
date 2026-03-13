import fs from 'node:fs';
import path from 'node:path';

import { rolldown } from 'rolldown';

import { getExternalModules, isExternalModuleRequest } from '../common/packageUtil.js';
import { buildParams } from '../util.js';


const buildServerRolldownConfig = (params) => {
  const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || packageData.name;
  const externalModules = getExternalModules(packageData);

  return {
    input: params.entryFilePath,
    output: {
      dir: params.outputDirectory,
      format: 'esm',
      sourcemap: params.dev,
      minify: !params.dev,
      entryFileNames: 'index.js',
      chunkFileNames: '[name].js',
      assetFileNames: 'assets/[name].[ext]',
    },
    platform: 'node',
    resolve: {
      mainFields: ['module', 'main'],
    },
    define: {
      'process.env.PACKAGE_NAME': JSON.stringify(name),
      'process.env.PACKAGE_VERSION': JSON.stringify(packageData.version),
    },
    external: (moduleName) => {
      if (moduleName.startsWith('node:')) {
        return true;
      }
      return isExternalModuleRequest(externalModules, moduleName);
    },
  };
};


export const buildServer = async (inputParams = {}) => {
  const defaultParams = {
    configModifier: undefined,
    dev: false,
    start: false,
    rolldownConfigModifier: undefined,
    webpackConfigModifier: undefined,
    analyzeBundle: false,
    shouldAliasModules: true,
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.ts'),
    outputDirectory: path.join(process.cwd(), './dist'),
  };
  const params = await buildParams(defaultParams, inputParams, false);
  if (params.webpackConfigModifier) {
    console.warn('Ignoring webpackConfigModifier for Rolldown builds. Migrate this customization to rolldownConfigModifier.');
  }
  if (params.analyzeBundle) {
    console.warn('Rolldown server bundle analysis is not implemented yet. Running a normal build instead.');
  }
  if (params.start) {
    console.warn('Rolldown server watch mode is not implemented yet. Running a one-off build instead.');
  }

  let rolldownConfig = buildServerRolldownConfig(params);
  if (params.rolldownConfigModifier) {
    rolldownConfig = params.rolldownConfigModifier(rolldownConfig);
  }
  const bundle = await rolldown(rolldownConfig);
  await bundle.write();
  await bundle.close();
};
