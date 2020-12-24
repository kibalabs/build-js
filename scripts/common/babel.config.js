const defaultParams = {
  polyfill: false,
  react: false,
  dev: false,
  preserveModules: false,
};

const polyfillSettings = {
  // NOTE(krishan711): this should be entry if we aren't processing all the node_modules
  // useBuiltIns: 'entry',
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
    sourceType: 'unambiguous',
    presets: [
      ['@babel/preset-env', {
        ...(params.polyfill ? polyfillSettings : {}),
        // https://medium.com/@craigmiller160/how-to-fully-optimize-webpack-4-tree-shaking-405e1c76038
        ...(params.preserveModules ? {modules: false} : {}),
      }],
      '@babel/preset-typescript',
      ...(params.react ? ['@babel/preset-react'] : []),
    ],
    plugins: [
      '@babel/plugin-transform-runtime',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-optional-chaining',
      ...(params.react ? [
        'react-hot-loader/babel',
        'babel-plugin-styled-components',
        '@loadable/babel-plugin',
      ] : []),
    ],
    // NOTE(krishan711): the below is for if node_modules are also compiled (see js.webpack.js)
    ignore: [
      /\/node_modules\/core-js\//,
      /\/node_modules\/@babel\//,
      /\/node_modules\/webpack\//,
    ],
  };
}
