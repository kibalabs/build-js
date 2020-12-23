const defaultParams = {
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
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
}
