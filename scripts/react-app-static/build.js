// NOTE(krishan711): this should probably be moved out. it's very specific to ui-react.
import fs from 'fs';
import path from 'path';

import CopyPlugin from 'copy-webpack-plugin';
import webpackMerge from 'webpack-merge';

import { buildCommonWebpackConfig } from '../common/common.webpack.js';
import { buildCssWebpackConfig } from '../common/css.webpack.js';
import { buildImagesWebpackConfig } from '../common/images.webpack.js';
import { buildJsWebpackConfig } from '../common/js.webpack.js';
import { createAndRunCompiler } from '../common/webpackUtil.js';
import { buildModuleWebpackConfig } from '../module/module.webpack.js';
import { buildReactAppWebpackConfig } from '../react-app/app.webpack.js';
import { removeUndefinedProperties } from '../util.js';
import { getPageData, renderHtml } from './static.js';

export const buildStaticReactApp = async (inputParams = {}) => {
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
    const configModifier = (await import(path.join(process.cwd(), params.configModifier))).default;
    params = configModifier(params);
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
    buildModuleWebpackConfig({ ...params, entryFilePath: appEntryFilePath, outputDirectory: buildDirectoryPath, outputFilename: 'index.cjs', excludeAllNodeModules: true }),
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
    buildCommonWebpackConfig({ ...params, name: `${name}-web` }),
    buildJsWebpackConfig({ ...params, polyfill: true, react: true }),
    buildImagesWebpackConfig(params),
    buildCssWebpackConfig(params),
    buildReactAppWebpackConfig({ ...params, entryFilePath, outputDirectory: outputDirectoryPath }),
  );
  if (params.webpackConfigModifier) {
    webWebpackConfig = params.webpackConfigModifier(webWebpackConfig);
  }

  await createAndRunCompiler(nodeWebpackConfig);
  const webpackBuildStats = await createAndRunCompiler(webWebpackConfig);
  fs.writeFileSync(path.join(buildDirectoryPath, 'webpackBuildStats.json'), JSON.stringify(webpackBuildStats));
  const app = (await import(path.resolve(buildDirectoryPath, 'index.cjs'))).default;
  // NOTE(krishan711): if this could be done in an parallel way it would be faster!
  params.pages.forEach(async (page) => {
    console.log(`Rendering page ${page.path} to ${page.filename}`);
    const pageData = (app.routes && app.globals) ? await getPageData(page.path, app.routes, app.globals) : null;
    const output = renderHtml(app.App, page, params.seoTags, name, path.join(buildDirectoryPath, 'webpackBuildStats.json'), pageData);
    const outputPath = path.join(outputDirectoryPath, page.filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output);
    console.log(`Done rendering page ${page.path}`);
  });
};
