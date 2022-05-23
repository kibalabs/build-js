const express = require('express');
const { matchPath } = require('react-router');

const { renderHtml } = require('../react-app-static/static');

const buildAppServer = (reactApp, reactRoutes, reactGlobals, params, publicDirectory, buildDirectoryPath, name, webpackBuildStats) => {
  const app = express();
  const getPageData = async (path) => {
    let matchedRoute = null;
    let matchData = null;
    reactRoutes.forEach((route) => {
      if (!matchData) {
        matchedRoute = route;
        matchData = matchPath(route.path, path);
      }
    });
    if (matchedRoute && matchedRoute.getPageData) {
      return matchedRoute.getPageData(reactGlobals, matchData.params);
    }
    return null;
  };

  app.use(express.static(publicDirectory));
  app.use(express.static(buildDirectoryPath));

  app.get('*', async (req, res) => {
    console.log(req.method, req.path, req.query);
    const startTime = new Date();
    const page = { path: req.path };
    const pageData = await getPageData(req.path);
    const output = renderHtml(reactApp, page, params, name, webpackBuildStats, pageData);
    const duration = (new Date() - startTime) / 1000.0;
    // TODO(krishan711): move this stuff to a middleware
    if (process.env.NAME) {
      res.header('X-Server-Name', process.env.NAME);
    }
    if (process.env.VERSION) {
      res.header('X-Server-Version', process.env.VERSION);
    }
    if (process.env.ENVIRONMENT) {
      res.header('X-Server-Environment', process.env.ENVIRONMENT);
    }
    res.header('X-Response-Time', String(duration));
    console.log(req.method, req.path, req.query, res.statusCode, duration);
    res.send(output);
  });
  return app;
};

module.exports = {
  buildAppServer,
};
