// NOTE(krishan711): this should probably be moved out. it's very specific to ui-react.
import fs from 'node:fs';
import path from 'node:path';

import { build, mergeConfig } from 'vite';

import { getPageData, renderViteHtml } from '../react-app-static/static.js';
import { buildReactAppViteConfig } from '../react-app-vite/app.config.js';
import { buildParams } from '../util.js';


export const buildStaticReactApp = async (inputParams = {}) => {
  const defaultParams = {
    configModifier: undefined,
    polyfill: true,
    polyfillTargets: undefined,
    webpackConfigModifier: undefined,
    analyzeBundle: false,
    shouldAliasModules: true,
    addHtmlOutput: true,
    addRuntimeConfig: true,
    runtimeConfigVars: {},
    seoTags: [],
    pages: [{ path: '/', filename: 'index.html' }],
    packageFilePath: path.join(process.cwd(), './package.json'),
    outputDirectory: path.join(process.cwd(), './dist'),
    publicDirectory: path.join(process.cwd(), './public'),
    appEntryFilePath: path.join(process.cwd(), './src/App.tsx'),
  };
  const params = await buildParams(defaultParams, inputParams, false);
  let viteConfig = buildReactAppViteConfig(params);
  if (params.viteConfigModifier) {
    viteConfig = params.viteConfigModifier(viteConfig);
  }
  const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || packageData.name;

  const outputDirectoryPath = path.resolve(params.outputDirectory);
  const appEntryFilePath = path.resolve(params.appEntryFilePath);
  // NOTE(krishan711): this is different from ssr because the client output is the output we want (ssr is only used once)
  const clientDirectory = outputDirectoryPath;
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
  const app = (await import(path.join(ssrDirectory, 'assets/app.js')));
  const appData = { name, port: params.port, defaultSeoTags: params.seoTags };
  const htmlTemplate = await fs.readFileSync(path.join(clientDirectory, 'index.html'), 'utf-8');
  // NOTE(krishan711): if this could be done in an parallel way it would be faster!
  params.pages.forEach(async (page) => {
    console.log(`Rendering page ${page.path} to ${page.filename}`);
    const pageData = (app.routes && app.globals) ? await getPageData(page.path, app.routes, app.globals) : null;
    const html = await renderViteHtml(app.App, page, appData.defaultSeoTags, appData.name, pageData, htmlTemplate);
    const outputPath = path.join(outputDirectoryPath, page.filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`Done rendering page ${page.path}`);
  });
};
