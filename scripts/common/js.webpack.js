const buildBabelConfig = require('./babel.config')

const defaultParams = {
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  const babelConfig = buildBabelConfig(params);
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
            options: babelConfig,
          },
          sourceType: 'unambiguous',
        },
      ],
    },
  };
}
