module.exports = (config = {}) => ({
  presets: [
    ["@babel/preset-env", config.polyfill ? {
      useBuiltIns: "usage",
      corejs: {
        version: 3.6,
        proposals: true,
      },
      targets: "defaults, >0.2%, not dead, ie 11",
    } : {}],
    "@babel/preset-typescript",
    ...(config.react ? ["@babel/preset-react"] : [])
  ],
  plugins: [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-optional-chaining",
    ...(config.react ? ["react-hot-loader/babel"] : [])
  ],
})
