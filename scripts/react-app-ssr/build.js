// NOTE(krishan711): this should probably be moved out. it's very specific to ui-react.
import fs from 'fs'
import path from 'path'

import webpackMerge from 'webpack-merge'

import makeCommonWebpackConfig from '../common/common.webpack'
import makeCssWebpackConfig from '../common/css.webpack'
import makeImagesWebpackConfig from '../common/images.webpack'
import makeJsWebpackConfig from '../common/js.webpack'
import { createAndRunCompiler } from '../common/webpackUtil'
import buildModuleWebpackConfig from '../module/module.webpack'
import makeReactAppWebpackConfig from '../react-app/app.webpack'
import { removeUndefinedProperties } from '../util'

// NOTE(krishan711): most ideas from https://emergent.systems/posts/ssr-in-react/
module.exports = (inputParams = {}) => {
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
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const configModifier = require(path.join(process.cwd(), params.configModifier));
    params = configModifier(params);
  }
  process.env.NODE_ENV = 'production';
  const package = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || package.name;

  const buildDirectoryPath = path.resolve(params.buildDirectory);
  const outputDirectoryPath = path.resolve(params.outputDirectory);
  const entryFilePath = path.resolve(params.entryFilePath);
  const appEntryFilePath = path.resolve(params.appEntryFilePath);

  let nodeWebpackConfig = webpackMerge.merge(
    makeCommonWebpackConfig({ ...params, name: `${name}-node` }),
    makeJsWebpackConfig({ ...params, polyfill: false, react: true }),
    makeImagesWebpackConfig(params),
    makeCssWebpackConfig(params),
    buildModuleWebpackConfig({ ...params, entryFilePath: appEntryFilePath, outputDirectory: buildDirectoryPath, excludeAllNodeModules: true, outputFilename: 'app.js' }),
  );
  if (params.webpackConfigModifier) {
    nodeWebpackConfig = params.webpackConfigModifier(nodeWebpackConfig);
  }

  let webWebpackConfig = webpackMerge.merge(
    makeCommonWebpackConfig({ ...params, name: `${name}-web` }),
    makeJsWebpackConfig({ ...params, polyfill: true, react: true }),
    makeImagesWebpackConfig(params),
    makeCssWebpackConfig(params),
    makeReactAppWebpackConfig({ ...params, entryFilePath, outputDirectory: outputDirectoryPath }),
  );
  if (params.webpackConfigModifier) {
    webWebpackConfig = params.webpackConfigModifier(webWebpackConfig);
  }

  return createAndRunCompiler(nodeWebpackConfig).then(() => {
    return createAndRunCompiler(webWebpackConfig);
  }).then((webpackBuildStats) => {
    const serverFilePath = path.join(buildDirectoryPath, 'server.js');
    fs.copyFileSync(path.join(__dirname, './server.js'), serverFilePath);
    fs.copyFileSync(path.join(__dirname, './start.sh'), path.join(outputDirectoryPath, 'start.sh'));
    fs.writeFileSync(path.join(buildDirectoryPath, 'data.json'), JSON.stringify({ name, defaultSeoTags: params.seoTags }));
    fs.writeFileSync(path.join(outputDirectoryPath, 'webpackBuildStats.json'), JSON.stringify(webpackBuildStats));

    let serverWebpackConfig = webpackMerge.merge(
      makeCommonWebpackConfig({ ...params, cleanOutputDirectory: false, name: `${name}-server` }),
      makeJsWebpackConfig({ ...params, react: false, polyfill: false }),
      buildModuleWebpackConfig({ ...params, entryFilePath: serverFilePath, outputDirectory: outputDirectoryPath, excludeAllNodeModules: true }),
    );
    if (params.webpackConfigModifier) {
      serverWebpackConfig = params.webpackConfigModifier(serverWebpackConfig);
    }
    return createAndRunCompiler(serverWebpackConfig);
  });
};
