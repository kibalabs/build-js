import { removeUndefinedProperties } from '../util';

const defaultParams = {
};

export const buildImagesWebpackConfig = (inputParams = {}) => {
  // eslint-disable-next-line unused-imports/no-unused-vars
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  return {
    module: {
      rules: [
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/,
          type: 'asset/resource',
        },
      ],
    },
  };
};
