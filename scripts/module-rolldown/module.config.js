import fs from 'fs';
import path from 'path';

import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rolldown';
import { minify } from 'rollup-plugin-esbuild';

import { getExternalModules, getNodeModules } from '../common/packageUtil';
import { buildTsConfig } from '../typing/ts.config';
import { removeUndefinedProperties } from '../util';


const defaultParams = {
  dev: undefined,
  name: undefined,
  packageFilePath: undefined,
  entryFilePath: undefined,
  outputDirectory: undefined,
  excludeAllNodeModules: undefined,
  nodeModulesPath: undefined,
  nodeModulesPaths: undefined,
  outputFilename: undefined,
};

export const buildModuleRolldownConfig = (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || packageData.name;

  const tsConfig = buildTsConfig({});

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
      format: 'umd',
      sourcemap: !params.dev,
    },
    platform: 'node',
    plugins: [
      minify(),
      ...(params.dev ? [] : [typescript({
        compilerOptions: {
          ...tsConfig.compilerOptions,
          emitDeclarationOnly: true,
          module: 'preserve',
          moduleResolution: 'Bundler',
          outDir: params.outputDirectory,
        },
        tsconfig: './tsconfig.json',
        noForceEmit: true,
      }),
      ]),
    ],
    define: {
      'process.env.PACKAGE_NAME': JSON.stringify(name),
      'process.env.PACKAGE_VERSION': JSON.stringify(packageData.version),
    },
    external: (module) => {
      const isExternal = externalModules.includes(module) || externalModules.includes(module.split('/')[0]);
      // console.log('module', module, isExternal);
      return isExternal;
    },
  });
};
