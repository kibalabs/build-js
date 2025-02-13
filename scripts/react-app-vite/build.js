import path from 'path';

import { build, createServer } from 'vite';

import { buildReactAppViteConfig } from './app.config';
import { removeUndefinedProperties, runParamsConfigModifier } from '../util';

// NOTE(krishan711): docs at https://vite.dev/guide/api-javascript.html
export const buildReactApp = async (inputParams = {}) => {
  const defaultParams = {
    dev: false,
    start: false,
    port: 3000,
    configModifier: undefined,
    polyfill: true,
    polyfillTargets: undefined,
    viteConfigModifier: undefined,
    analyzeBundle: false,
    shouldAliasModules: true,
    addHtmlOutput: true,
    addRuntimeConfig: true,
    runtimeConfigVars: {},
    seoTags: [],
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.tsx'),
    outputDirectory: path.join(process.cwd(), './dist'),
    publicDirectory: path.join(process.cwd(), './public'),
  };
  let params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  params = await runParamsConfigModifier(params);

  let viteConfig = buildReactAppViteConfig(params);
  if (params.viteConfigModifier) {
    viteConfig = params.viteConfigModifier(viteConfig);
  }

  if (params.start) {
    const server = await createServer(viteConfig);
    await server.listen();
    server.printUrls();
    server.bindCLIShortcuts({ print: true });
  } else {
    await build(viteConfig);
  }
};
