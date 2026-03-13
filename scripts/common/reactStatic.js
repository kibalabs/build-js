import React from 'react';

import ReactDOMServer from 'react-dom/server';
import ReactDOMStatic from 'react-dom/static';
import { matchPath } from 'react-router';

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
  const titleRegex = /<title>.*?<\/title>/gi;
  let lastTitleMatch = null;

  while (true) {
    const titleMatch = titleRegex.exec(htmlString);
    if (titleMatch === null) {
      break;
    }
    lastTitleMatch = titleMatch;
  }
  return lastTitleMatch ? lastTitleMatch[0] : null;
};

const extractLinkTagsFromString = (htmlString) => {
  const linkTags = [];
  const linkRegex = /<link.*?\/>/gi;
  let linkMatch;

  while (true) {
    linkMatch = linkRegex.exec(htmlString);
    if (linkMatch === null) {
      break;
    }
    linkTags.push(linkMatch[0]);
  }
  return linkTags;
};

const extractHeadContentFromString = (htmlString) => {
  const titleTag = extractTitleTagFromString(htmlString);
  const linkTags = extractLinkTagsFromString(htmlString);
  return linkTags.concat(titleTag ? [titleTag] : []);
};

const removeTitleTagFromString = (htmlString) => {
  const titleTag = extractTitleTagFromString(htmlString);
  if (titleTag == null) {
    return htmlString;
  }
  return htmlString.replace(titleTag, '');
};

export const renderViteHtml = async (app, page, defaultSeoTags, appName, pageData, htmlTemplate) => {
  const bodyString = await renderToString(
    React.createElement(app, { staticPath: page.path, pageData }),
  );
  const extractedHeadTags = extractHeadContentFromString(bodyString);
  const extractedHeadTagsString = extractedHeadTags.join('');
  let pageSeoTags = page.seoTags;
  if (!pageSeoTags && defaultSeoTags && page.path === '/') {
    pageSeoTags = defaultSeoTags;
  }
  const seoTags = pageSeoTags || [];
  const headString = ReactDOMServer.renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement('script', { type: 'text/javascript', dangerouslySetInnerHTML: { __html: `window.KIBA_RENDERED_PATH = '${page.path}';` } }),
      React.createElement('script', { type: 'text/javascript', dangerouslySetInnerHTML: { __html: `window.KIBA_PAGE_DATA = ${JSON.stringify(pageData)};` } }),
      ...seoTags.map((tag) => React.createElement(tag.tagName, { ...tag.attributes, key: JSON.stringify(tag) })),
    ),
  );
  const cleanedHeadString = extractedHeadTagsString.includes('<title>') ? removeTitleTagFromString(headString) : headString;
  const fullHeadString = extractedHeadTagsString + cleanedHeadString;
  const cleanedHtmlTemplate = fullHeadString.includes('<title>') ? removeTitleTagFromString(htmlTemplate) : htmlTemplate;
  let output = cleanedHtmlTemplate.replace('<!--ssr-body-->', bodyString);
  output = output.replace('<!--ssr-head-->', fullHeadString);
  return output;
};