// NOTE(krishan711): this should probably be moved out. it's very specific to ui-react.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

import webpackMerge from 'webpack-merge';

import { buildCommonWebpackConfig } from '../common/common.webpack.js';
import { buildCssWebpackConfig } from '../common/css.webpack.js';
import { buildImagesWebpackConfig } from '../common/images.webpack.js';
import { buildJsWebpackConfig } from '../common/js.webpack.js';
import { createAndRunCompiler } from '../common/webpackUtil.js';
import { buildModuleWebpackConfig } from '../module/module.webpack.js';
import { buildReactAppWebpackConfig } from '../react-app/app.webpack.js';
import { removeUndefinedProperties } from '../util.js';


// NOTE(krishan711): most ideas from https://emergent.systems/posts/ssr-in-react/
export const buildSsrReactApp = async (inputParams = {}) => {
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
    pages: [],
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.tsx'),
    appEntryFilePath: path.join(process.cwd(), './src/app.tsx'),
    buildDirectory: path.join(process.cwd(), './build'),
    outputDirectory: path.join(process.cwd(), './dist'),
    publicDirectory: path.join(process.cwd(), './public'),
  };

  let params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  if (params.configModifier) {
    const configModifier = (await import(path.join(process.cwd(), params.configModifier))).default;
    if (configModifier.constructor.name === 'AsyncFunction') {
      params = await configModifier(params);
    } else {
      params = configModifier(params);
    }
  }
  process.env.NODE_ENV = 'production';
  const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || packageData.name;

  const buildDirectoryPath = path.resolve(params.buildDirectory);
  const outputDirectoryPath = path.resolve(params.outputDirectory);
  const entryFilePath = path.resolve(params.entryFilePath);
  const appEntryFilePath = path.resolve(params.appEntryFilePath);

  let nodeWebpackConfig = webpackMerge.merge(
    buildCommonWebpackConfig({ ...params, name: `${name}-node` }),
    buildJsWebpackConfig({ ...params, polyfill: false, react: true }),
    buildImagesWebpackConfig(params),
    buildCssWebpackConfig(params),
    buildModuleWebpackConfig({ ...params, entryFilePath: appEntryFilePath, outputDirectory: buildDirectoryPath, excludeAllNodeModules: true, outputFilename: 'app.js' }),
  );
  if (params.webpackConfigModifier) {
    nodeWebpackConfig = params.webpackConfigModifier(nodeWebpackConfig);
  }

  let webWebpackConfig = webpackMerge.merge(
    buildCommonWebpackConfig({ ...params, name: `${name}-web` }),
    buildJsWebpackConfig({ ...params, polyfill: true, react: true }),
    buildImagesWebpackConfig(params),
    buildCssWebpackConfig(params),
    buildReactAppWebpackConfig({ ...params, entryFilePath, outputDirectory: outputDirectoryPath }),
  );
  if (params.webpackConfigModifier) {
    webWebpackConfig = params.webpackConfigModifier(webWebpackConfig);
  }

  return createAndRunCompiler(nodeWebpackConfig, undefined, undefined, true, params.analyzeBundle).then(() => {
    return createAndRunCompiler(webWebpackConfig, undefined, undefined, true, params.analyzeBundle);
  }).then((webpackBuildStats) => {
    const serverFilePath = path.join(buildDirectoryPath, 'server');

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    fs.copyFileSync(path.join(__dirname, './server.js'), serverFilePath);
    fs.copyFileSync(path.join(__dirname, './start.sh'), path.join(outputDirectoryPath, 'start.sh'));
    fs.writeFileSync(path.join(buildDirectoryPath, 'data.json'), JSON.stringify({ name, defaultSeoTags: params.seoTags }));
    fs.writeFileSync(path.join(outputDirectoryPath, 'webpackBuildStats.json'), JSON.stringify(webpackBuildStats));

    let serverWebpackConfig = webpackMerge.merge(
      buildCommonWebpackConfig({ ...params, cleanOutputDirectory: false, name: `${name}-server` }),
      buildJsWebpackConfig({ ...params, react: false, polyfill: false }),
      buildModuleWebpackConfig({ ...params, entryFilePath: serverFilePath, outputDirectory: outputDirectoryPath, excludeAllNodeModules: true }),
    );
    if (params.webpackConfigModifier) {
      serverWebpackConfig = params.webpackConfigModifier(serverWebpackConfig);
    }
    return createAndRunCompiler(serverWebpackConfig, undefined, undefined, true, params.analyzeBundle);
  });
};
