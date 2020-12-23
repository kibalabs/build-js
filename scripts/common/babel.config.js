const defaultParams = {
  polyfill: false,
  react: false,
};

const polyfillSettings = {
  useBuiltIns: "usage",
  corejs: {
    version: 3,
    proposals: true,
  },
  // TODO(krishan711): support reading this from package.json if its there
  targets: "defaults, >0.2%, not dead, ie 11",
}

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  return {
    presets: [
      ["@babel/preset-env", {
        ...(params.polyfill ? polyfillSettings : {}),
      }],
      "@babel/preset-typescript",
      ...(params.react ? ["@babel/preset-react"] : [])
    ],
    plugins: [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-optional-chaining",
      ...(params.react ? [
        "react-hot-loader/babel",
        "babel-plugin-styled-components",
        "@loadable/babel-plugin",
      ] : [])
    ],
    ignore: [
      /\/core-js/,
      /@babel\b/,
    ],
    overrides: [{
      test: /node_modules\//,
      sourceType: 'unambiguous',
    }],
  };
}
