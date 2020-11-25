const webpack = require('webpack');

module.exports = (config = {}) => ({
  mode: 'development',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ]
});
