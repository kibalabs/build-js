// const path = require('node:path');
// import { fileURLToPath } from 'url';

// import { getPageData, renderHtml } from '@kibalabs/build/scripts/react-app-static/static';
import compression from 'compression';
import express from 'express';

// import { App, globals, routes } from './app';
// import { defaultSeoTags, name } from './data.json';

const shouldCompress = (req, res) => {
  if (req.headers['x-no-compression']) {
    return false;
  }
  return compression.filter(req, res);
};

export const createAppServer = () => {
  const app = express();
  app.disable('x-powered-by');
  // app.use(express.static(__dirname, { immutable: true, maxAge: '1y' }));
  app.use(compression({ filter: shouldCompress }));
  // app.get('*', async (req, res) => {
  //   console.log(req.method, req.path, req.query);
  //   const startTime = new Date();
  //   const page = { path: req.path };
  //   const pageData = await getPageData(req.path, routes, globals);
  //   const webpackBuildStatsFilePath = path.join(__dirname, 'webpackBuildStats.json');
  //   const output = renderHtml(App, page, defaultSeoTags, name, webpackBuildStatsFilePath, pageData);
  //   const duration = (new Date() - startTime) / 1000.0;
  //   // TODO(krishan711): move this stuff to a middleware
  //   if (process.env.NAME) {
  //     res.header('X-Server-Name', process.env.NAME);
  //   }
  //   if (process.env.VERSION) {
  //     res.header('X-Server-Version', process.env.VERSION);
  //   }
  //   if (process.env.ENVIRONMENT) {
  //     res.header('X-Server-Environment', process.env.ENVIRONMENT);
  //   }
  //   res.header('X-Response-Time', String(duration));
  //   console.log(req.method, req.path, req.query, res.statusCode, duration);
  //   res.send(output);
  // });
  return app;
};

// const host = '0.0.0.0';
// const port = 3000;
// app.listen(port, host, () => {
//   console.log(`Started server at http://${host}:${port}`);
// });
