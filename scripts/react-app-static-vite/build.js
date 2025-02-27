// NOTE(krishan711): this should probably be moved out. it's very specific to ui-react.
import fs from 'node:fs';
import path from 'node:path';

import { build, mergeConfig } from 'vite';

import { getPageData, renderViteHtml } from '../react-app-static/static.js';
import { buildReactAppViteConfig } from '../react-app-vite/app.config.js';
import { removeUndefinedProperties, runParamsConfigModifier } from '../util.js';


export const buildStaticReactApp = async (inputParams = {}) => {
  const defaultParams = {
    dev: false,
    configModifier: undefined,
    polyfill: true,
    polyfillTargets: undefined,
    webpackConfigModifier: undefined,
    analyzeBundle: false,
    shouldAliasModules: true,
    addHtmlOutput: false,
    addRuntimeConfig: true,
    runtimeConfigVars: {},
    seoTags: [],
    pages: [{ path: '/', filename: 'index.html' }],
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
  const clientOutputDirectoryPath = path.join(outputDirectoryPath, '_client');
  const ssrOutputDirectoryPath = path.join(outputDirectoryPath, '_ssr');
  console.log('building app...');
  await build(mergeConfig(viteConfig, {
    build: {
      outDir: clientOutputDirectoryPath,
    },
  }));
  console.log('building server app...');
  await build(mergeConfig(viteConfig, {
    build: {
      ssr: true,
      outDir: ssrOutputDirectoryPath,
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

  const app = (await import(path.join(ssrOutputDirectoryPath, 'assets/App.js')));
  const htmlTemplate = await fs.readFileSync(path.join(clientOutputDirectoryPath, 'index.html'), 'utf-8');
  // NOTE(krishan711): if this could be done in an parallel way it would be faster!
  params.pages.forEach(async (page) => {
    console.log(`Rendering page ${page.path} to ${page.filename}`);
    const pageData = (app.routes && app.globals) ? await getPageData(page.path, app.routes, app.globals) : null;
    const output = renderViteHtml(app.App, page, params.seoTags, name, pageData, htmlTemplate);
    const outputPath = path.join(outputDirectoryPath, page.filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output);
    console.log(`Done rendering page ${page.path}`);
  });
};
