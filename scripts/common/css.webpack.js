const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { removeUndefinedProperties } = require('../util');

const defaultParams = {
};

const buildCssWebpackConfig = (inputParams = {}) => {
  // eslint-disable-next-line unused-imports/no-unused-vars
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  return {
    plugins: [
      new MiniCssExtractPlugin(),
    ],
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                url: {
                  filter: (url) => {
                    // NOTE(krishan711): ignore absolute urls - put them in a public folder yourself!
                    if (url.startsWith('/')) {
                      return false;
                    }
                    return true;
                  },
                },
              },
            },
          ],
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },
  };
};

module.exports = {
  buildCssWebpackConfig,
};
