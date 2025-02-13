import fs from 'node:fs';

import { buildBabelConfig } from './babel.config.js';
import { removeUndefinedProperties } from '../util.js';

const defaultParams = {
  packageFilePath: undefined,
  polyfillTargets: undefined,
};

export const buildJsWebpackConfig = (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  if (!params.polyfillTargets) {
    params.polyfillTargets = packageData.browserslist;
  }
  const babelConfig = buildBabelConfig(params);
  return {
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.(j|t)sx?$/,
          // NOTE(krishan711): node_modules should possibly be included so that they are polyfilled by core-js
          // NOTE(krishan711): if this is un-commented, include core-js as an entry in react-app webpack config
          // exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              ...babelConfig,
              cacheDirectory: params.dev,
            },
          },
        },
      ],
    },
  };
};
