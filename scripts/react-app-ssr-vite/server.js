// NOTE(krishan711): this should probably be moved out. it's very specific to ui-react.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPageData, renderViteHtml } from '@kibalabs/build/scripts/react-app-static/static.js';
import compression from 'compression';
import express from 'express';

import * as app from './_ssr/assets/App.js';
import data from './data.json' with { type: 'json' };

const shouldCompress = (req, res) => {
  if (req.headers['x-no-compression']) {
    return false;
  }
  return compression.filter(req, res);
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlTemplate = await fs.readFileSync(path.join(__dirname, '_client/index.html'), 'utf-8');
export const createAppServer = () => {
  const server = express();
  server.disable('x-powered-by');
  server.use(express.static(path.join(__dirname, '_client'), { immutable: true, maxAge: '1y', index: false }));
  server.use(compression({ filter: shouldCompress }));
  server.get('*', async (req, res) => {
    const startTime = new Date();
    const page = { path: req.path };
    const pageData = await getPageData(req.path, app.routes, app.globals);
    const html = renderViteHtml(app.App, page, data.defaultSeoTags, data.name, pageData, htmlTemplate);
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
    const duration = (new Date() - startTime) / 1000.0;
    res.header('X-Response-Time', String(duration));
    console.log(req.method, req.path, req.query, res.statusCode, duration);
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  });
  return server;
};

const host = '0.0.0.0';
const port = data.port || 3000;
const server = createAppServer();
server.listen(port, host, () => {
  console.log(`Started server at http://${host}:${port}`);
});
