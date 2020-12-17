const defaultParams = {
  polyfill: false,
  react: false,
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  return {
    presets: [
      ["@babel/preset-env", params.polyfill ? {
        useBuiltIns: "usage",
        corejs: {
          version: 3.6,
          proposals: true,
        },
        targets: "defaults, >0.2%, not dead, ie 11",
      } : {}],
      "@babel/preset-typescript",
      ...(params.react ? ["@babel/preset-react"] : [])
    ],
    plugins: [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-optional-chaining",
      ...(params.react ? ["react-hot-loader/babel"] : [])
    ],
  };
}
