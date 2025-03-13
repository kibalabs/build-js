import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

import pluginReactSwc from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

import { createIndexPlugin } from './createIndexPlugin.js';
import { createRuntimeConfigPlugin } from './createRuntimeConfigPlugin.js';
import { injectSeoPlugin } from './injectSeoPlugin.js';
import { getNodeModuleName, getNodeModuleSize, removeUndefinedProperties } from '../util.js';


const defaultParams = {
  dev: undefined,
  name: undefined,
  addHtmlOutput: undefined,
  addRuntimeConfig: undefined,
  runtimeConfigVars: undefined,
  seoTags: undefined,
  title: undefined,
  packageFilePath: undefined,
  entryFilePath: undefined,
  outputDirectory: undefined,
  publicDirectory: undefined,
};

export const buildReactAppViteConfig = (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || packageData.name;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const indexTemplateFilePath = path.join(__dirname, './index.html');

  const runtimeConfigVars = params.runtimeConfigVars;
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('KRT_')) {
      runtimeConfigVars[key] = process.env[key];
    }
  });

  const moduleSizeCache = {};

  return defineConfig({
    plugins: [
      pluginReactSwc(),
      nodePolyfills(),
      ...(params.addHtmlOutput ? [createIndexPlugin({ templateFilePath: indexTemplateFilePath, name })] : []),
      ...(params.addRuntimeConfig ? [createRuntimeConfigPlugin({ vars: runtimeConfigVars })] : []),
      ...((params.seoTags || params.title) ? [injectSeoPlugin({ title: params.title || name, tags: params.seoTags || [] })] : []),
    ],
    mode: params.dev ? 'development' : 'production',
    server: {
      host: '0.0.0.0',
      port: params.port,
    },
    build: {
      rollupOptions: {
        input: params.entryFilePath,
        output: {
          // NOTE(krishan711): this splits each vendor into a separate file because
          // if we try to chunk the smaller ones together it causes circular imports
          manualChunks(id) {
            if (id.includes('/node_modules/')) {
              const packageName = getNodeModuleName(id);
              let packageSize = moduleSizeCache[packageName];
              if (packageSize === undefined) {
                packageSize = getNodeModuleSize(packageName, process.cwd());
                moduleSizeCache[packageName] = packageSize;
              }
              if (packageSize > 0) {
                return `vendor-${packageName.replace('@', '').replace('/', '-')}`;
              }
              return 'vendor';
            }
            return undefined;
          },
        },
      },
    },
    define: {
      APP_NAME: JSON.stringify(name),
      APP_VERSION: JSON.stringify(packageData.version),
      APP_DESCRIPTION: JSON.stringify(packageData.description),
      // 'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
      // 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    publicDir: params.publicDirectory,
  });
};
