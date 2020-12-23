const defaultParams = {
  polyfill: false,
  react: false,
  dev: false,
  preserveModules: false,
};

const polyfillSettings = {
  useBuiltIns: 'usage',
  corejs: {
    version: 3,
    proposals: true,
  },
  // TODO(krishan711): support reading this from package.json if its there
  targets: 'defaults, >0.2%, not dead, ie 11',
}

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  return {
    presets: [
      ['@babel/preset-env', {
        ...(params.polyfill ? polyfillSettings : {}),
        // https://medium.com/@craigmiller160/how-to-fully-optimize-webpack-4-tree-shaking-405e1c76038
        ...(params.preserveModules ? {modules: false} : {}),
      }],
      '@babel/preset-typescript',
      ...(params.react ? ['@babel/preset-react'] : [])
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-optional-chaining',
      ...(params.react ? [
        'react-hot-loader/babel',
        'babel-plugin-styled-components',
        '@loadable/babel-plugin',
      ] : [])
    ],
    ignore: [
      /^core-js/,
      /^@babel\b/,
      /^webpack/,
    ],
    overrides: [{
      test: /(node_modules|build|dist)\//,
      sourceType: 'unambiguous',
    }],
  };
}
