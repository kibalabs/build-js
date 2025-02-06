const path = require('path');

const { build, createServer } = require('vite');

const { buildReactAppViteConfig } = require('./app.config');
const { removeUndefinedProperties, runParamsConfigModifier } = require('../util');

// NOTE(krishan711): docs at https://vite.dev/guide/api-javascript.html
const buildReactApp = async (inputParams = {}) => {
  const defaultParams = {
    dev: false,
    start: false,
    port: 3000,
    configModifier: undefined,
    polyfill: true,
    polyfillTargets: undefined,
    viteConfigModifier: undefined,
    analyzeBundle: false,
    shouldAliasModules: true,
    addHtmlOutput: true,
    addRuntimeConfig: true,
    runtimeConfigVars: {},
    seoTags: [],
    packageFilePath: path.join(process.cwd(), './package.json'),
    entryFilePath: path.join(process.cwd(), './src/index.tsx'),
    outputDirectory: path.join(process.cwd(), './dist'),
    publicDirectory: path.join(process.cwd(), './public'),
  };

  let params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  params = await runParamsConfigModifier(params);
  process.env.NODE_ENV = params.dev ? 'development' : 'production';

  let viteConfig = buildReactAppViteConfig(params);
  if (params.viteConfigModifier) {
    viteConfig = params.viteConfigModifier(viteConfig);
  }

  if (params.start) {
    const server = await createServer(viteConfig);
    await server.listen();
    server.printUrls();
    server.bindCLIShortcuts({ print: true });
  } else {
    await build(viteConfig);
  }

  // const compiler = createCompiler(mergedConfig, undefined, undefined, true, params.analyzeBundle);
  // if (params.start) {
  //   const host = '0.0.0.0';
  //   const port = params.port;
  //   const server = new WebpackDevServer({
  //     host,
  //     port,
  //     hot: true,
  //     historyApiFallback: true,
  //     devMiddleware: {
  //       publicPath: mergedConfig.output.publicPath,
  //     },
  //     client: {
  //       logging: 'info',
  //       overlay: false,
  //     },
  //     open: false,
  //     static: {
  //       directory: mergedConfig.output.publicPath,
  //       watch: {
  //         aggregateTimeout: 1000,
  //         poll: undefined,
  //         ignored: ['**/*.d.ts'],
  //       },
  //     },
  //     ...(mergedConfig.devServer || {}),
  //   }, compiler);
  //   server.startCallback(() => {
  //     console.log(chalk.cyan('Starting the development server...\n'));
  //     if (host === '0.0.0.0') {
  //       dns.lookup(os.hostname(), (dnsError, address) => {
  //         console.log(`Use ${mergedConfig.name} at: http://${address}:${port}`);
  //         open(`http://localhost:${port}`, { stdio: 'inherit' });
  //       });
  //     } else {
  //       console.log(`Use ${mergedConfig.name} at: http://${host}:${port}`);
  //       open(`http://${host}:${port}`, { stdio: 'inherit' });
  //     }
  //   });
  // } else {
  //   compiler.run();
  // }
};

module.exports = {
  buildReactApp,
};
