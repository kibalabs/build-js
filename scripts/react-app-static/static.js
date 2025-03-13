// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';

import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOMServer from 'react-dom/server';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOMStatic from 'react-dom/static';
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

async function renderToString(reactComponent) {
  const { prelude } = await ReactDOMStatic.prerenderToNodeStream(reactComponent);
  return new Promise((resolve, reject) => {
    let data = '';
    prelude.on('data', (chunk) => {
      data += chunk;
    });
    prelude.on('end', () => resolve(data));
    prelude.on('error', reject);
  });
}


const extractTitleTagFromString = (htmlString) => {
  let titleTag = null;
  const titleRegex = /<title>.*?<\/title>/gi;
  let titleMatch;
  let lastTitleMatch = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    titleMatch = titleRegex.exec(htmlString);
    if (titleMatch === null) {
      break;
    }
    lastTitleMatch = titleMatch;
  }
  if (lastTitleMatch) {
    titleTag = lastTitleMatch[0];
  }
  return titleTag;
};

const extractLinkTagsFromString = (htmlString) => {
  const linkTags = [];
  const linkRegex = /<link.*?\/>/gi;
  let linkMatch;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    linkMatch = linkRegex.exec(htmlString);
    if (linkMatch === null) {
      break;
    }
    linkTags.push(linkMatch[0]);
  }
  return linkTags;
}

const extractHeadContentFromString = (htmlString) => {
  const titleTag = extractTitleTagFromString(htmlString);
  const linkTags = extractLinkTagsFromString(htmlString);
  return linkTags.concat(titleTag ? [titleTag] : []);
};

const removeTitleTagFromString = (htmlString) => {
  const titleTag = extractTitleTagFromString(htmlString);
  console.log('found titleTag', titleTag);
  if (titleTag == null) {
    return htmlString;
  }
  return htmlString.replace(titleTag, '');
};

const removeStringsFromString = (string, stringsToRemove) => {
  let output = string;
  stringsToRemove.forEach((stringToRemove) => {
    output = output.replace(stringToRemove, '');
  });
  return output;
};

export const renderViteHtml = async (app, page, defaultSeoTags, appName, pageData, htmlTemplate) => {
  console.log('renderViteHtml')
  const styledComponentsSheet = new ServerStyleSheet();
  const bodyString = await renderToString(
    React.createElement(
      StyleSheetManager,
      { sheet: styledComponentsSheet.instance },
      React.createElement(app, { staticPath: page.path, pageData }),
    ),
  );
  console.log('bodyString', bodyString.length, bodyString.slice(0, 100));
  // NOTE(krishan711): prerenderToNodeStream doesnt extract out the stuff that should go to the head so we have to do it manually for now
  const extractedHeadTags = extractHeadContentFromString(bodyString);
  console.log('extractedHeadTags', extractedHeadTags);
  const extractedHeadTagsString = extractedHeadTags.join('');
  console.log('extractedHeadTagsString', extractedHeadTagsString.length, extractedHeadTagsString.slice(0, 100));
  const cleanedBodyString = removeStringsFromString(bodyString, extractedHeadTags);
  console.log('cleanedBodyString', cleanedBodyString.length, cleanedBodyString.slice(0, 100));
  let pageSeoTags = page.seoTags;
  if (!pageSeoTags && defaultSeoTags && page.path === '/') {
    pageSeoTags = defaultSeoTags;
  }
  const seoTags = pageSeoTags || [];
  const headString = ReactDOMServer.renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      // NOTE(krishan711): this should be kept in sync with react-app/index.html
      React.createElement('script', { type: 'text/javascript', dangerouslySetInnerHTML: { __html: `window.KIBA_RENDERED_PATH = '${page.path}';` } }),
      React.createElement('script', { type: 'text/javascript', dangerouslySetInnerHTML: { __html: `window.KIBA_PAGE_DATA = ${JSON.stringify(pageData)};` } }),
      ...seoTags.map((tag) => React.createElement(tag.tagName, { ...tag.attributes, key: JSON.stringify(tag) })),
      styledComponentsSheet.getStyleElement(),
    ),
  );
  console.log('headString', headString.length, headString.slice(0, 100));
  const cleanedHeadString = extractedHeadTagsString.includes('<title>') ? removeTitleTagFromString(headString) : headString;
  console.log('cleanedHeadString', cleanedHeadString.length, cleanedHeadString.slice(0, 100));
  const fullHeadString = extractedHeadTagsString + cleanedHeadString;
  console.log('fullHeadString', fullHeadString.length, fullHeadString.slice(0, 100));
  const cleanedHTmlTemplate = fullHeadString.includes('<title>') ? removeTitleTagFromString(htmlTemplate) : htmlTemplate;
  let output = cleanedHTmlTemplate.replace('<!--ssr-body-->', bodyString);
  output = output.replace('<!--ssr-head-->', fullHeadString);
  return output;
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
      ...seoTags.map((tag) => React.createElement(tag.tagName, { ...tag.attributes, key: JSON.stringify(tag) })),
      ...tags.map((tag) => React.createElement(tag.type, { ...tag.attributes, key: tag.headId, 'ui-react-head': tag.headId }, tag.content)),
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
