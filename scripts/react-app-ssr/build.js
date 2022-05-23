// NOTE(krishan711): this should probably be moved out. it's very specific to ui-react.
const dns = require('dns');
const fs = require('fs');
const os = require('os');
const path = require('path');

const chalk = require('chalk');
const webpackMerge = require('webpack-merge');

const makeCommonWebpackConfig = require('../common/common.webpack');
const makeCssWebpackConfig = require('../common/css.webpack');
const makeImagesWebpackConfig = require('../common/images.webpack');
const makeJsWebpackConfig = require('../common/js.webpack');
const { open } = require('../common/platformUtil');
const { createAndRunCompiler } = require('../common/webpackUtil');
const makeReactAppWebpackConfig = require('../react-app/app.webpack');
const makeReactComponentWebpackConfig = require('../react-component/component.webpack');
const { removeUndefinedProperties } = require('../util');
const { buildAppServer } = require('./server');

// NOTE(krishan711): most ideas from https://emergent.systems/posts/ssr-in-react/

module.exports = (inputParams = {}) => {
  const defaultParams = {
    dev: false,
    start: false,
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

  const publicDirectoryPath = path.resolve(params.publicDirectory);
  const buildDirectoryPath = path.resolve(params.buildDirectory);
  const outputDirectoryPath = path.resolve(params.outputDirectory);
  const entryFilePath = path.resolve(params.entryFilePath);
  const appEntryFilePath = path.resolve(params.appEntryFilePath);

  let nodeWebpackConfig = webpackMerge.merge(
    makeCommonWebpackConfig({ ...params, name: `${name}-node` }),
    makeJsWebpackConfig({ ...params, polyfill: false, react: true }),
    makeImagesWebpackConfig(params),
    makeCssWebpackConfig(params),
    makeReactComponentWebpackConfig({ ...params, entryFilePath: appEntryFilePath, outputDirectory: buildDirectoryPath, excludeAllNodeModules: true }),
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
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const { App, routes, globals } = require(path.resolve(buildDirectoryPath, 'index.js'));
    const app = buildAppServer(App, routes, globals, params, publicDirectoryPath, outputDirectoryPath, name, webpackBuildStats);
    const host = '0.0.0.0';
    const port = 3000;
    return app.listen(port, host, () => {
      console.log(chalk.cyan('Starting the development server...\n'));
      if (host === '0.0.0.0') {
        dns.lookup(os.hostname(), (dnsError, address) => {
          console.log(`Use ${name} at: http://${address}:${port}`);
          open(`http://localhost:${port}`, { stdio: 'inherit' });
        });
      } else {
        console.log(`Use ${name} at: http://${host}:${port}`);
        open(`http://${host}:${port}`, { stdio: 'inherit' });
      }
    });
  });
};
