// NOTE(krishan711): this should probably be moved out. it's very specific to ui-react.
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('url');

// const { renderToString } = require('react-dom/server');
const { mergeConfig, build } = require('vite');

const { removeUndefinedProperties, runParamsConfigModifier } = require('../util');
const { createAppServer } = require('./server');
// const { getPageData } = require('../react-app-static/static');
const { buildReactAppViteConfig } = require('../react-app-vite/app.config');


// NOTE(krishan711): most ideas from https://emergent.systems/posts/ssr-in-react/
const buildSsrReactApp = async (inputParams = {}) => {
  const defaultParams = {
    dev: false,
    start: false,
    port: 3000,
    configModifier: undefined,
    viteConfigModifier: undefined,
    analyzeBundle: false,
    shouldAliasModules: true,
    addHtmlOutput: true,
    addRuntimeConfig: true,
    runtimeConfigVars: {},
    seoTags: [],
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.tsx'),
    appEntryFilePath: path.join(process.cwd(), './src/app.tsx'),
    buildDirectory: path.join(process.cwd(), './build'),
    outputDirectory: path.join(process.cwd(), './dist'),
    publicDirectory: path.join(process.cwd(), './public'),
  };
  let params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  params = await runParamsConfigModifier(params);
  // const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  // const name = params.name || packageData.name;

  let viteConfig = buildReactAppViteConfig(params);
  if (params.viteConfigModifier) {
    viteConfig = params.viteConfigModifier(viteConfig);
  }

  const buildDirectoryPath = path.resolve(params.buildDirectory);
  const outputDirectoryPath = path.resolve(params.outputDirectory);
  const entryFilePath = path.resolve(params.entryFilePath);
  const appEntryFilePath = path.resolve(params.appEntryFilePath);

  // let nodeWebpackConfig = webpackMerge.merge(
  //   buildCommonWebpackConfig({ ...params, name: `${name}-node` }),
  //   buildJsWebpackConfig({ ...params, polyfill: false, react: true }),
  //   buildImagesWebpackConfig(params),
  //   buildCssWebpackConfig(params),
  //   buildModuleWebpackConfig({ ...params, entryFilePath: appEntryFilePath, outputDirectory: buildDirectoryPath, excludeAllNodeModules: true, outputFilename: 'app.js' }),
  // );
  // if (params.webpackConfigModifier) {
  //   nodeWebpackConfig = params.webpackConfigModifier(nodeWebpackConfig);
  // }

  // let webWebpackConfig = webpackMerge.merge(
  //   buildCommonWebpackConfig({ ...params, name: `${name}-web` }),
  //   buildJsWebpackConfig({ ...params, polyfill: true, react: true }),
  //   buildImagesWebpackConfig(params),
  //   buildCssWebpackConfig(params),
  //   buildReactAppWebpackConfig({ ...params, entryFilePath, outputDirectory: outputDirectoryPath }),
  // );
  // if (params.webpackConfigModifier) {
  //   webWebpackConfig = params.webpackConfigModifier(webWebpackConfig);
  // }

  // return createAndRunCompiler(nodeWebpackConfig, undefined, undefined, true, params.analyzeBundle).then(() => {
  //   return createAndRunCompiler(webWebpackConfig, undefined, undefined, true, params.analyzeBundle);
  // }).then((webpackBuildStats) => {
  //   const serverFilePath = path.join(buildDirectoryPath, 'server');

  //   // const __dirname = path.dirname(fileURLToPath(import.meta.url));
  //   fs.copyFileSync(path.join(__dirname, './server.js'), serverFilePath);
  //   fs.copyFileSync(path.join(__dirname, './start.sh'), path.join(outputDirectoryPath, 'start.sh'));
  //   fs.writeFileSync(path.join(buildDirectoryPath, 'data.json'), JSON.stringify({ name, defaultSeoTags: params.seoTags }));
  //   fs.writeFileSync(path.join(outputDirectoryPath, 'webpackBuildStats.json'), JSON.stringify(webpackBuildStats));

  //   let serverWebpackConfig = webpackMerge.merge(
  //     buildCommonWebpackConfig({ ...params, cleanOutputDirectory: false, name: `${name}-server` }),
  //     buildJsWebpackConfig({ ...params, react: false, polyfill: false }),
  //     buildModuleWebpackConfig({ ...params, entryFilePath: serverFilePath, outputDirectory: outputDirectoryPath, excludeAllNodeModules: true }),
  //   );
  //   if (params.webpackConfigModifier) {
  //     serverWebpackConfig = params.webpackConfigModifier(serverWebpackConfig);
  //   }
  //   return createAndRunCompiler(serverWebpackConfig, undefined, undefined, true, params.analyzeBundle);
  // });

  console.log('building app');
  await build(mergeConfig(viteConfig, {
    // NOTE(krishan711): prevent the hashes in the names
    build: {
      ssr: true,
      outDir: './dist-ssr',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        input: appEntryFilePath,
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
  }));

  console.log('building server');
  // const template = fs.readFileSync('./dist-ssr/index.html', 'utf-8');
  const app = require(path.resolve('./dist-ssr/assets/app.js'));
  console.log('app', app);
  const appServer = createAppServer();
  appServer.use(express.static('./dist-ssr/'), { index: false });
  appServer.use('*', async (_, res) => {
    try {
      // const html = template.replace(`<!--outlet-->`, render);
      res.status(200).set({ 'Content-Type': 'text/html' }).end('<html />');
    } catch (error) {
      res.status(500).end(error);
    }
  });
  // appServer.use(vite.middlewares);
  // appServer.use('*', async (req, res, next) => {
  //   const url = req.originalUrl;
  //   console.log('url', url);
  //   try {
  //     const indexTemplateFilePath = path.join(__dirname, '..', 'react-app-vite', './index.html');
  //     const indexTemplate = fs.readFileSync(indexTemplateFilePath, 'utf-8');
  //     const template = await vite.transformIndexHtml(url, indexTemplate);
  //     console.log('template', template);
  //     const { App, routes, globals } = await vite.ssrLoadModule(appEntryFilePath);
  //     console.log('App', App);
  //     console.log('routes', routes);
  //     console.log('globals', globals);
  //     const pageData = await getPageData(req.path, routes, globals);
  //     console.log('pageData', pageData);
  //     const html = template.replace('<!--ssr-->', () => renderToString(App));
  //     res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  //   } catch (error) {
  //     vite.ssrFixStacktrace(error);
  //     next(error);
  //   }
  // });
  appServer.listen(params.port);
};

module.exports = {
  buildSsrReactApp,
};
