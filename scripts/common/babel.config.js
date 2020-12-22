const { collapseTextChangeRangesAcrossMultipleVersions } = require("typescript");

const defaultParams = {
  polyfill: false,
  react: false,
  dev: false,
  preserveModules: false,
};

const polyfillSettings = {
  useBuiltIns: "usage",
  corejs: {
    version: 3.6,
    proposals: true,
  },
  targets: "defaults, >0.2%, not dead, ie 11",
}

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  console.log('params', params);
  return {
    presets: [
      ["@babel/preset-env", {
        ...(params.polyfill ? polyfillSettings : {}),
        // https://medium.com/@craigmiller160/how-to-fully-optimize-webpack-4-tree-shaking-405e1c76038
        ...(params.preserveModules ? {modules: false} : {}),
      }],
      "@babel/preset-typescript",
      ...(params.react ? ["@babel/preset-react"] : [])
    ],
    plugins: [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-optional-chaining",
      // ...(params.react ? ["react-hot-loader/babel"] : []),
      ...(params.react && params.dev ? ["react-refresh/babel"] : []),
    ],
  };
}
