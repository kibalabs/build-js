// NOTE(krishan711): this should probably be moved out. it's very specific to ui-react.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPageData, renderViteHtml } from '@kibalabs/build/scripts/react-app-static/static.js';
import compression from 'compression';

const shouldCompress = (req, res) => {
  if (req.headers['x-no-compression']) {
    return false;
  }
  return compression.filter(req, res);
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDirectory = path.join(__dirname, '_client');
const ssrDirectory = path.join(__dirname, '_ssr');
const app = (await import(path.join(ssrDirectory, 'assets/app.js')));
const appData = (await import(path.join(ssrDirectory, 'appData.json'), { with: { type: 'json' } })).default;
const htmlTemplate = await fs.readFileSync(path.join(clientDirectory, 'index.html'), 'utf-8');
console.log('process.env.NODE_ENV', process.env.NODE_ENV);
console.log('process.env.NODE_ENV', process.env.NODE_ENV);
// export const createAppServer = () => {
//   const server = express();
//   server.disable('x-powered-by');
//   server.use(express.static(clientDirectory, { immutable: true, maxAge: '1y', index: false }));
//   server.use(compression({ filter: shouldCompress }));
//   server.get('*', async (req, res) => {
//     const queryString = Object.entries(req.query)
//       .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
//       .join('&');
//     console.log(`${req.method}:${req.path}:${queryString}`);
//     const startTime = new Date();
//     const page = { path: req.path };
//     const pageData = (app.routes && app.globals) ? await getPageData(page.path, app.routes, app.globals) : null;
//     const html = await renderViteHtml(app.App, page, appData.defaultSeoTags, appData.name, pageData, htmlTemplate);
//     // TODO(krishan711): move this stuff to a middleware
//     if (process.env.NAME) {
//       res.header('X-Server-Name', process.env.NAME);
//     }
//     if (process.env.VERSION) {
//       res.header('X-Server-Version', process.env.VERSION);
//     }
//     if (process.env.ENVIRONMENT) {
//       res.header('X-Server-Environment', process.env.ENVIRONMENT);
//     }
//     const duration = (new Date() - startTime) / 1000.0;
//     res.header('X-Response-Time', String(duration));
//     console.log(`${req.method}:${req.path}:${queryString}:${res.statusCode}:${duration}`);
//     res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
//   });
//   return server;
// };

// const host = '0.0.0.0';
// const port = appData.port || 3000;
// const server = createAppServer();
// server.listen(port, host, () => {
//   console.log(`Started server at http://${host}:${port}`);
// });

const outputDirectoryPath = __dirname;
const page = { path: '/', filename: 'index.html' };
const pageData = (app.routes && app.globals) ? await getPageData(page.path, app.routes, app.globals) : null;
const html = await renderViteHtml(app.App, page, appData.defaultSeoTags, appData.name, pageData, htmlTemplate);
const outputPath = path.join(outputDirectoryPath, page.filename);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html);
console.log(`Done rendering page ${page.path}`);
