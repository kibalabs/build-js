// NOTE(krishan711): this should probably be moved out. it's very specific to ui-react.
const fs = require('fs');
const path = require('path');

const webpackMerge = require('webpack-merge');

const makeCommonWebpackConfig = require('../common/common.webpack');
const makeCssWebpackConfig = require('../common/css.webpack');
const makeImagesWebpackConfig = require('../common/images.webpack');
const makeJsWebpackConfig = require('../common/js.webpack');
const { createAndRunCompiler } = require('../common/webpackUtil');
const makeReactAppWebpackConfig = require('../react-app/app.webpack');
const makeReactComponentWebpackConfig = require('../react-component/component.webpack');
const makeServerWebpackConfig = require('../server/server.webpack');
const { removeUndefinedProperties } = require('../util');

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
    makeReactComponentWebpackConfig({ ...params, entryFilePath: appEntryFilePath, outputDirectory: buildDirectoryPath, excludeAllNodeModules: true, outputFilename: 'app.js' }),
  );
  if (params.webpackConfigModifier) {
    nodeWebpackConfig = params.webpackConfigModifier(nodeWebpackConfig);
  }

  let webWebpackConfig = webpackMerge.merge(
    makeCommonWebpackConfig({ ...params, name: `${name}-web` }),
    makeJsWebpackConfig({ ...params, react: true }),
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
    fs.writeFileSync(path.join(buildDirectoryPath, 'data.json'), JSON.stringify({ name, defaultSeoTags: params.seoTags }));
    fs.writeFileSync(path.join(outputDirectoryPath, 'webpackBuildStats.json'), JSON.stringify(webpackBuildStats));

    let serverWebpackConfig = webpackMerge.merge(
      makeCommonWebpackConfig({ ...params, cleanOutputDirectory: false, name: `${name}-server` }),
      makeJsWebpackConfig({ ...params, react: false, polyfill: false }),
      makeServerWebpackConfig({ ...params, entryFilePath: serverFilePath, outputDirectory: outputDirectoryPath, excludeAllNodeModules: true }),
    );
    if (params.webpackConfigModifier) {
      serverWebpackConfig = params.webpackConfigModifier(serverWebpackConfig);
    }
    return createAndRunCompiler(serverWebpackConfig);
  });
};
