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
              name: '[name]__[local]___[hash:base64:5].[ext]',
              outputPath: 'assets/',
              publicPath: '/assets/',
            },
          },
        },
      ],
    },
  };
};
