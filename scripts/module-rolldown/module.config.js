import fs from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'rolldown';

import { generateTypeDeclarationsPlugin } from './generateTypeDeclarationsPlugin.js';
import { getExternalModules, getNodeModules } from '../common/packageUtil.js';
import { sassPlugin } from '../plugins/sassPlugin.js';
import { removeUndefinedProperties } from '../util.js';


const defaultParams = {
  dev: undefined,
  name: undefined,
  packageFilePath: undefined,
  entryFilePaths: undefined,
  entryFilePath: undefined,
  outputDirectory: undefined,
  excludeAllNodeModules: undefined,
  nodeModulesPath: undefined,
  nodeModulesPaths: undefined,
  outputFilename: undefined,
  typescriptDeclarationCompilerOptions: undefined,
};

export const buildModuleRolldownConfig = (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || packageData.name;

  const externalModules = [];
  if (params.excludeAllNodeModules) {
    const nodeModulesPaths = params.nodeModulesPaths || [params.nodeModulesPath || path.join(process.cwd(), './node_modules')];
    nodeModulesPaths.forEach((nodeModulesPath) => {
      externalModules.push(...getNodeModules(nodeModulesPath));
    });
  } else {
    externalModules.push(...getExternalModules(packageData));
  }
  // NOTE(krishan711): not sure why but outputDirectory is not being used
  return defineConfig({
    input: params.entryFilePath,
    output: {
      dir: params.outputDirectory,
      file: params.outputFilename,
      name,
      format: 'esm',
      sourcemap: !params.dev,
      minify: !params.dev,
    },
    platform: 'neutral',
    // Explicitly set mainFields for module resolution
    resolve: {
      mainFields: ['module', 'main'],
    },
    plugins: [
      sassPlugin,
      ...(params.dev ? [] : [generateTypeDeclarationsPlugin({
        inputFilePaths: params.entryFilePaths || [params.entryFilePath],
        outputDirectory: params.outputDirectory,
        compilerOptions: params.typescriptDeclarationCompilerOptions,
      })]),
    ],
    define: {
      'process.env.PACKAGE_NAME': JSON.stringify(name),
      'process.env.PACKAGE_VERSION': JSON.stringify(packageData.version),
    },
    external: (moduleName) => {
      // Treat node: prefixed imports as external
      if (moduleName.startsWith('node:')) {
        return true;
      }
      const packageName = moduleName.startsWith('@') ? moduleName.split('/').slice(0, 2).join('/') : moduleName.split('/')[0];
      const isExternal = externalModules.includes(moduleName) || externalModules.includes(packageName);
      return isExternal;
    },
  });
};
