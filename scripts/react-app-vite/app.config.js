import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

import pluginReactSwc from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

import { createIndexPlugin } from './createIndexPlugin.js';
import { createRuntimeConfigPlugin } from './createRuntimeConfigPlugin.js';
import { injectSeoPlugin } from './injectSeoPlugin.js';
import { getNodeModuleName, getNodeModuleSize, removeUndefinedProperties } from '../util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const defaultParams = {
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
      ...(params.addHtmlOutput ? [createIndexPlugin({ templateFilePath: indexTemplateFilePath, name, entryFilePath: params.entryFilePath })] : []),
      ...(params.addRuntimeConfig ? [createRuntimeConfigPlugin({ vars: runtimeConfigVars })] : []),
      ...((params.seoTags || params.title) ? [injectSeoPlugin({ title: params.title || name, tags: params.seoTags || [] })] : []),
    ],
    mode: process.env.NODE_ENV || 'production',
    server: {
      host: '0.0.0.0',
      port: params.port,
    },
    build: {
      rolldownOptions: {
        input: path.join(process.cwd(), './index.html'),
        output: {
          // NOTE(krishan711): Rolldown treats each name() return value as a separate
          // code-splitting group, so minSize is evaluated per returned chunk name.
          // Keep dedicated chunks only for larger packages and funnel smaller ones
          // into a shared vendor chunk, matching the old webpack behavior.
          codeSplitting: {
            includeDependenciesRecursively: true,
            groups: [{
              name: (moduleId) => {
                if (!moduleId.includes('/node_modules/')) {
                  return null;
                }
                const packageName = getNodeModuleName(moduleId);
                let packageSize = moduleSizeCache[packageName];
                if (packageSize === undefined) {
                  packageSize = getNodeModuleSize(packageName, process.cwd());
                  moduleSizeCache[packageName] = packageSize;
                }
                const chunkName = packageSize >= (100 * 1024) ? `vendor-${packageName.replace('@', '').replace('/', '-')}` : 'vendor-small';
                return chunkName;
              },
              test: /node_modules/,
              priority: 10,
              minSize: 100 * 1024,
            }],
          },
        },
      },
    },
    define: {
      APP_NAME: JSON.stringify(name),
      APP_VERSION: JSON.stringify(packageData.version),
      APP_DESCRIPTION: JSON.stringify(packageData.description),
    },
    publicDir: params.publicDirectory,
  });
};
