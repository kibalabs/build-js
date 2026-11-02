import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

import pluginReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { createIndexPlugin } from './createIndexPlugin.js';
import { createRuntimeConfigPlugin } from './createRuntimeConfigPlugin.js';
import { injectSeoPlugin } from './injectSeoPlugin.js';
import { createVendorChunking } from './vendorChunks.js';
import { removeUndefinedProperties } from '../util.js';

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

  const vendorChunking = createVendorChunking();

  return defineConfig({
    plugins: [
      pluginReact(),
      vendorChunking.plugin,
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
          codeSplitting: vendorChunking.codeSplitting,
          strictExecutionOrder: vendorChunking.strictExecutionOrder,
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
