const defaultParams = {
  polyfill: false,
  react: false,
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
      "@loadable/babel-plugin",
      ...(params.react ? ["react-hot-loader/babel"] : [])
    ],
  };
}
