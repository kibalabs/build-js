const babelConfig = require('./babel.config')

module.exports = (config = {}) => ({
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(j|t)sx?$/,
        exclude: /(node_modules|build|dist)\//,
        use: {
          loader: 'babel-loader',
          options: babelConfig(config),
        },
      },
    ],
  },
});
