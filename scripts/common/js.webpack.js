const babelConfig = require('./babel.config')

const defaultParams = {
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  return {
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
            options: babelConfig(params),
          },
        },
      ],
    },
  };
}
