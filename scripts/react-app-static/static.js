// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';

import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOMServer from 'react-dom/server';
import { matchPath } from 'react-router';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

export const getPageData = async (urlPath, appRoutes, globals) => {
  let matchedRoute = null;
  let matchData = null;
  appRoutes.forEach((route) => {
    if (!matchData) {
      matchedRoute = route;
      matchData = matchPath(route.path, urlPath);
    }
  });
  if (matchedRoute && matchedRoute.getPageData) {
    try {
      return matchedRoute.getPageData(globals, matchData.params);
    } catch (error) {
      console.error(`Failed to getPageDate for ${urlPath}: ${error}`);
    }
  }
  return null;
};

export const renderHtml = (app, page, defaultSeoTags, appName, webpackBuildStatsFilePath, pageData = null) => {
  let pageHead = { headId: '', base: null, title: null, links: [], metas: [], styles: [], scripts: [], noscripts: [] };
  const setHead = (newHead) => { pageHead = newHead; };
  const styledComponentsSheet = new ServerStyleSheet();
  const extractor = new ChunkExtractor({ statsFile: webpackBuildStatsFilePath });
  const bodyString = ReactDOMServer.renderToString(
    React.createElement(
      ChunkExtractorManager,
      { extractor },
      React.createElement(
        StyleSheetManager,
        { sheet: styledComponentsSheet.instance },
        React.createElement(app, { staticPath: page.path, pageData, setHead }),
      ),
    ),
  );
  let pageSeoTags = page.seoTags;
  if (!pageSeoTags && defaultSeoTags && page.path === '/') {
    pageSeoTags = defaultSeoTags;
  }
  const seoTags = pageSeoTags || [];
  const tags = [
    ...(pageHead.title ? [pageHead.title] : [{ type: 'title', content: page.title || appName, attributes: [] }]),
    ...(pageHead.base ? [pageHead.base] : []),
    ...pageHead.links,
    ...pageHead.metas,
    ...pageHead.styles,
    ...pageHead.scripts,
  ];
  const headString = ReactDOMServer.renderToStaticMarkup(
    React.createElement(
      'head',
      null,
      // NOTE(krishan711): this should be kept in sync with react-app/index.html
      React.createElement('meta', { charSet: 'utf-8' }),
      React.createElement('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      React.createElement('script', { type: 'text/javascript', src: '/runtimeConfig.js' }),
      React.createElement('script', { type: 'text/javascript', dangerouslySetInnerHTML: { __html: `window.KIBA_RENDERED_PATH = '${page.path}';` } }),
      React.createElement('script', { type: 'text/javascript', dangerouslySetInnerHTML: { __html: `window.KIBA_PAGE_DATA = ${JSON.stringify(pageData)};` } }),
      ...seoTags.map((tag, index) => (
        React.createElement(tag.tagName, { ...tag.attributes, key: index })
      )),
      ...tags.map((tag, index) => (
        React.createElement(tag.type, { ...tag.attributes, key: index, 'ui-react-head': tag.headId }, tag.content)
      )),
      ...extractor.getLinkElements(),
      ...extractor.getStyleElements(),
      styledComponentsSheet.getStyleElement(),
    ),
  );
  const bodyAssetsString = ReactDOMServer.renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      ...extractor.getScriptElements(),
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
  return output;
};
