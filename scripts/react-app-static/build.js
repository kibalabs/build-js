const fs = require('fs');
const path = require('path');

const { ChunkExtractor, ChunkExtractorManager } = require('@loadable/server');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { ServerStyleSheet, StyleSheetManager } = require('styled-components');
const webpackMerge = require('webpack-merge');

const makeCommonWebpackConfig = require('../common/common.webpack');
const makeCssWebpackConfig = require('../common/css.webpack');
const makeImagesWebpackConfig = require('../common/images.webpack');
const makeJsWebpackConfig = require('../common/js.webpack');
const { createAndRunCompiler } = require('../common/webpackUtil');
const makeReactAppWebpackConfig = require('../react-app/app.webpack');
const makeReactComponentWebpackConfig = require('../react-component/component.webpack');

module.exports = (inputParams = {}) => {
  const defaultParams = {
    configModifier: undefined,
    webpackConfigModifier: undefined,
    analyzeBundle: false,
    shouldAliasModules: true,
    addHtmlOutput: false,
    pages: [{ path: '/', filename: 'index.html' }],
    directory: path.join(process.cwd(), 'src'),
    buildDirectory: path.join(process.cwd(), 'build'),
    outputDirectory: path.join(process.cwd(), 'dist'),
  };

  let params = { ...defaultParams, ...inputParams };
  if (params.configModifier) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const configModifier = require(path.join(process.cwd(), params.configModifier));
    params = configModifier(params);
  }
  process.env.NODE_ENV = 'production';

  const sourceDirectoryPath = path.resolve(params.directory);
  const buildDirectoryPath = path.resolve(params.buildDirectory);
  const outputDirectoryPath = path.resolve(params.outputDirectory);

  let nodeWebpackConfig = webpackMerge.merge(
    makeCommonWebpackConfig({ ...params, name: 'site-node' }),
    makeJsWebpackConfig({ ...params, polyfill: false, react: true }),
    makeImagesWebpackConfig(params),
    makeCssWebpackConfig(params),
    makeReactComponentWebpackConfig({ ...params, entryFilePath: path.join(sourceDirectoryPath, './app.tsx'), outputDirectory: buildDirectoryPath, excludeAllNodeModules: true }),
  );
  if (params.webpackConfigModifier) {
    nodeWebpackConfig = params.webpackConfigModifier(nodeWebpackConfig);
  }

  let webWebpackConfig = webpackMerge.merge(
    makeCommonWebpackConfig({ ...params, name: 'site' }),
    makeJsWebpackConfig({ ...params, polyfill: true, react: true }),
    makeImagesWebpackConfig(params),
    makeCssWebpackConfig(params),
    makeReactAppWebpackConfig({ ...params, entryFilePath: path.join(sourceDirectoryPath, './index.tsx'), outputDirectory: outputDirectoryPath }),
  );
  if (params.webpackConfigModifier) {
    webWebpackConfig = params.webpackConfigModifier(webWebpackConfig);
  }

  return createAndRunCompiler(nodeWebpackConfig).then(() => {
    return createAndRunCompiler(webWebpackConfig);
  }).then((webpackBuildStats) => {
    const { App } = require(path.resolve(buildDirectoryPath, 'index.js'));
    params.pages.forEach((page) => {
      console.log(`Rendering page ${page.path} to ${page.filename}`);
      let pageHead = { headId: '', base: null, title: null, links: [], metas: [], styles: [], scripts: [], noscripts: [] };
      const setHead = (newHead) => { pageHead = newHead; };
      const styledComponentsSheet = new ServerStyleSheet();
      const extractor = new ChunkExtractor({ stats: webpackBuildStats });
      const bodyString = ReactDOMServer.renderToString(
        React.createElement(ChunkExtractorManager, { extractor: extractor },
          React.createElement(StyleSheetManager, { sheet: styledComponentsSheet.instance},
            React.createElement(App, { staticPath: page.path, setHead: setHead }),
          ),
        ),
      );
      const tags = [
        ...(pageHead.title ? [pageHead.title] : []),
        ...(pageHead.base ? [pageHead.base] : []),
        ...pageHead.links,
        ...pageHead.metas,
        ...pageHead.styles,
        ...pageHead.scripts,
      ];
      const headString = ReactDOMServer.renderToStaticMarkup(
        React.createElement('head', null,
          ...tags.map((tag, index) => (
            React.createElement(tag.type, { ...tag.attributes, key: index, 'ui-react-head': tag.headId }, tag.content)
          )),
          ...extractor.getPreAssets().map((asset) => (
            React.createElement('link', { key: asset.filename, 'data-chunk': asset.chunk, rel: asset.linkType, as: asset.scriptType, href: asset.url })
          )),
          styledComponentsSheet.getStyleElement(),
        ),
      );
      const bodyAssetsString = ReactDOMServer.renderToStaticMarkup(
        React.createElement(React.Fragment, null,
          ...extractor.getMainAssets().map((asset) => (
            React.createElement(asset.scriptType, { key: asset.filename, 'data-chunk': asset.chunk, async: true, src: asset.url })
          )),
        ),
      );
      const output = `<!DOCTYPE html>
        <html lang="en">
          ${headString}
          <body>
            <div id="root">${bodyString}</div>
            ${bodyAssetsString}
          </body>
        </html>
      `;
      const outputPath = path.join(outputDirectoryPath, page.filename);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, output);
      console.log(`EP: done rendering page ${page.path}`);
    });
  });
};
