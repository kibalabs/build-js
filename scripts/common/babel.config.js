import { removeUndefinedProperties } from '../util';

const defaultParams = {
  polyfill: false,
  polyfillTargets: 'defaults, >0.2%, not dead, ie 11',
  react: false,
  dev: false,
  preserveModules: false,
};

export const buildBabelConfig = (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const polyfillSettings = {
    // NOTE(krishan711): this should be entry if we aren't processing all the node_modules
    // useBuiltIns: 'entry',
    useBuiltIns: 'usage',
    corejs: {
      version: 3,
      proposals: true,
    },
    targets: params.polyfillTargets,
  };

  return {
    sourceType: 'unambiguous',
    presets: [
      ['@babel/preset-env', {
        ...(params.polyfill ? polyfillSettings : {}),
        // https://medium.com/@craigmiller160/how-to-fully-optimize-webpack-4-tree-shaking-405e1c76038
        ...(params.preserveModules ? { modules: false } : {}),
      }],
      '@babel/preset-typescript',
      ...(params.react ? [['@babel/preset-react', { development: params.dev, runtime: 'automatic' }]] : []),
    ],
    plugins: [
      '@babel/plugin-transform-runtime',
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-optional-chaining',
      ...(params.react ? [
        'babel-plugin-styled-components',
        '@loadable/babel-plugin',
      ] : []),
      ...(params.react && params.dev ? ['react-refresh/babel'] : []),
    ],
    // NOTE(krishan711): the below is for if node_modules are also compiled (see js.webpack.js)
    ignore: [
      /\/node_modules\/core-js\//,
      /\/node_modules\/@babel\//,
      /\/node_modules\/webpack\//,
    ],
    overrides: [{
      test: /(node_modules|build|dist)\//,
      compact: true,
    }],
  };
};
