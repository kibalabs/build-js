import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'url';

import pluginReactSwc from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

import { createIndexPlugin } from './createIndexPlugin.js';
import { createRuntimeConfigPlugin } from './createRuntimeConfigPlugin.js';
import { injectSeoPlugin } from './injectSeoPlugin.js';
import { getNodeModuleName, getNodeModuleSize, removeUndefinedProperties } from '../util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// NOTE(krishan711): Workaround for vite-plugin-node-polyfills shim resolution issue.
// External packages have hardcoded imports to 'vite-plugin-node-polyfills/shims/*' baked in,
// but Rollup/esbuild can't resolve these from packages outside the workspace.
// We resolve the actual shim paths and create aliases for both build and dev.
// See: https://github.com/davidmyersdev/vite-plugin-node-polyfills/issues/140
// Remove this when upgrading to a version that includes the fix from PR #141.
const require = createRequire(import.meta.url);
const shimPaths = {
  'vite-plugin-node-polyfills/shims/buffer': require.resolve('vite-plugin-node-polyfills/shims/buffer'),
  'vite-plugin-node-polyfills/shims/global': require.resolve('vite-plugin-node-polyfills/shims/global'),
  'vite-plugin-node-polyfills/shims/process': require.resolve('vite-plugin-node-polyfills/shims/process'),
};

// NOTE(krishan711): Custom shim for node:module. Libraries like markdown-to-jsx v9 import
// createRequire but never use it. The default polyfill (empty.js) doesn't export createRequire,
// causing build errors. This provides a stub that throws if actually called.
const moduleShimPath = path.join(__dirname, './moduleShim.js');

const createShimsResolverPlugin = () => ({
  name: 'vite-plugin-node-polyfills-shims-resolver',
  resolveId(source) {
    if (shimPaths[source]) {
      return { id: shimPaths[source], external: false };
    }
    return null;
  },
});

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
      nodePolyfills({
        // NOTE(krishan711): Use 'build' only for globals to avoid shim resolution issues in dev.
        // See: https://github.com/davidmyersdev/vite-plugin-node-polyfills/issues/140
        globals: {
          Buffer: 'build',
          global: 'build',
          process: 'build',
        },
        overrides: {
          module: moduleShimPath,
        },
      }),
      createShimsResolverPlugin(),
      ...(params.addHtmlOutput ? [createIndexPlugin({ templateFilePath: indexTemplateFilePath, name })] : []),
      ...(params.addRuntimeConfig ? [createRuntimeConfigPlugin({ vars: runtimeConfigVars })] : []),
      ...((params.seoTags || params.title) ? [injectSeoPlugin({ title: params.title || name, tags: params.seoTags || [] })] : []),
    ],
    mode: process.env.NODE_ENV || 'production',
    resolve: {
      alias: shimPaths,
    },
    optimizeDeps: {
      esbuildOptions: {
        alias: shimPaths,
      },
    },
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
    },
    publicDir: params.publicDirectory,
  });
};
