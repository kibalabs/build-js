import fs from 'node:fs';
import path from 'node:path';

// NOTE(krishan711): this should probably be moved out. it's very specific to ui-react.
import express from 'express';
import { build, mergeConfig } from 'vite';

import { removeUndefinedProperties, runParamsConfigModifier } from '../util.js';
import { createAppServer } from './server.js';
// import { getPageData } from '../react-app-static/static.js';
import { getPageData, renderViteHtml } from '../react-app-static/static.js';
import { buildReactAppViteConfig } from '../react-app-vite/app.config.js';


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

  console.log('building app...');
  await build(viteConfig);
  console.log('building server app...');
  await build(mergeConfig(viteConfig, {
    build: {
      ssr: true,
      outDir: path.join(outputDirectoryPath, '_ssr'),
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

  const htmlTemplate = await fs.readFileSync(path.join(outputDirectoryPath, 'index.html'), 'utf-8');
  const app = await import(path.join(outputDirectoryPath, '_ssr/assets/App.js'));
  const appServer = createAppServer();
  appServer.use(express.static(outputDirectoryPath, { immutable: true, maxAge: '1y' }));
  appServer.get('*', async (req, res) => {
    const startTime = new Date();
    const page = { path: req.path };
    const pageData = await getPageData(req.path, app.routes, app.globals);
    const html = renderViteHtml(app.App, page, params.seoTags, name, pageData, htmlTemplate);
    // TODO(krishan711): move this stuff to a middleware
    if (process.env.NAME) {
      res.header('X-Server-Name', process.env.NAME);
    }
    if (process.env.VERSION) {
      res.header('X-Server-Version', process.env.VERSION);
    }
    if (process.env.ENVIRONMENT) {
      res.header('X-Server-Environment', process.env.ENVIRONMENT);
    }
    const duration = (new Date() - startTime) / 1000.0;
    res.header('X-Response-Time', String(duration));
    console.log(req.method, req.path, req.query, res.statusCode, duration);
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  });
  await appServer.listen(params.port);
};
