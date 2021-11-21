const defaultParams = {
};

module.exports = (inputParams = {}) => {
  // eslint-disable-next-line unused-imports/no-unused-vars
  const params = { ...defaultParams, ...inputParams };
  return {
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            'isomorphic-style-loader',
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
