// NOTE(krishan711): this should probably be moved out. it's very specific to ui-react.
const fs = require('fs');
const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');
const webpackMerge = require('webpack-merge');

const makeCommonWebpackConfig = require('../common/common.webpack');
const makeCssWebpackConfig = require('../common/css.webpack');
const makeImagesWebpackConfig = require('../common/images.webpack');
const makeJsWebpackConfig = require('../common/js.webpack');
const { createAndRunCompiler } = require('../common/webpackUtil');
const makeModuleWebpackConfig = require('../module/module.webpack');
const makeReactAppWebpackConfig = require('../react-app/app.webpack');
const { removeUndefinedProperties } = require('../util');
const { getPageData, renderHtml } = require('./static');

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
    pages: [{ path: '/', filename: 'index.html' }],
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
    makeModuleWebpackConfig({ ...params, entryFilePath: appEntryFilePath, outputDirectory: buildDirectoryPath, excludeAllNodeModules: true }),
    // NOTE(krishan711): copy the public directory in cos things in it may be used by the static rendered
    {
      plugins: [
        new CopyPlugin({
          patterns: [
            { from: params.publicDirectory, noErrorOnMissing: true },
          ],
        }),
      ],
    },
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
    fs.writeFileSync(path.join(buildDirectoryPath, 'webpackBuildStats.json'), JSON.stringify(webpackBuildStats));
    // NOTE(krishan711): if this could be done in an async way it would be faster!
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const { App, routes, globals } = require(path.resolve(buildDirectoryPath, 'index.js'));

    params.pages.forEach(async (page) => {
      console.log(`Rendering page ${page.path} to ${page.filename}`);
      const pageData = (routes && globals) ? await getPageData(page.path, routes, globals) : null;
      const output = renderHtml(App, page, params.seoTags, name, path.join(buildDirectoryPath, 'webpackBuildStats.json'), pageData);
      const outputPath = path.join(outputDirectoryPath, page.filename);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, output);
      console.log(`Done rendering page ${page.path}`);
    });
  });
};
