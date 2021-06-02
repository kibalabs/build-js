const defaultParams = {
};

module.exports = (inputParams = {}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const params = { ...defaultParams, ...inputParams };
  return {
    module: {
      rules: [
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/,
          use: {
            loader: 'url-loader',
            options: {
              fallback: 'file-loader',
              name: '[name].[contenthash].[ext]',
              outputPath: 'assets/',
              publicPath: '/assets/',
            },
          },
        },
      ],
    },
  };
};
