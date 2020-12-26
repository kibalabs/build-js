const defaultParams = {
};

module.exports = (inputParams = {}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const params = { ...defaultParams, ...inputParams };
  return {
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
  };
};
