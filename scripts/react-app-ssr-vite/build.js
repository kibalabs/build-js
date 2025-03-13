import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build, mergeConfig } from 'vite';

import { buildReactAppViteConfig } from '../react-app-vite/app.config.js';
import { removeUndefinedProperties, runParamsConfigModifier } from '../util.js';

// NOTE(krishan711): most ideas from https://thenewstack.io/how-to-build-a-server-side-react-app-using-vite-and-express/
export const buildSsrReactApp = async (inputParams = {}) => {
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
    outputDirectory: path.join(process.cwd(), './dist'),
    publicDirectory: path.join(process.cwd(), './public'),
    appEntryFilePath: path.join(process.cwd(), './src/App.tsx'),
  };
  let params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  params = await runParamsConfigModifier(params);
  let viteConfig = buildReactAppViteConfig(params);
  if (params.viteConfigModifier) {
    viteConfig = params.viteConfigModifier(viteConfig);
  }
  const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || packageData.name;

  const outputDirectoryPath = path.resolve(params.outputDirectory);
  const appEntryFilePath = path.resolve(params.appEntryFilePath);
  const clientDirectory = path.join(outputDirectoryPath, '_client');
  const ssrDirectory = path.join(outputDirectoryPath, '_ssr');
  console.log('building app...');
  await build(mergeConfig(viteConfig, {
    build: {
      outDir: clientDirectory,
    },
  }));
  console.log('building server app...');
  await build(mergeConfig(viteConfig, {
    build: {
      ssr: true,
      outDir: ssrDirectory,
      rollupOptions: {
        input: appEntryFilePath,
        // NOTE(krishan711): prevent the hashes in the names
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
  }));
  const appData = { name, port: params.port, defaultSeoTags: params.seoTags };
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  fs.copyFileSync(path.join(__dirname, './server.js'), path.join(outputDirectoryPath, 'index.js'));
  fs.writeFileSync(path.join(ssrDirectory, 'appData.json'), JSON.stringify(appData));
  console.log('Run `node dist/index.js` to start the server');
};
