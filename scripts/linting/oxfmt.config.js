import { removeUndefinedProperties } from '../util.js';


export const buildOxfmtConfig = (inputParams = {}) => {
  const defaultParams = {
  };

  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const config = {
    singleQuote: true,
    jsxSingleQuote: true,
    sortImports: true,
    ignorePatterns: [
      '**/node_modules/**/*',
      '**/build/**/*',
      '**/dist/**/*',
      '**/dist-ssr/**/*',
      '**/public/**/*',
    ],
  };
  if (params.configModifier) {
    return params.configModifier(config);
  }
  return config;
};
