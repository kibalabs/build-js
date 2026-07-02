import { removeUndefinedProperties } from '../util.js';


export const buildOxfmtConfig = (inputParams = {}) => {
  const defaultParams = {
  };

  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const config = {
    singleQuote: true,
    jsxSingleQuote: true,
    sortImports: true,
    // NOTE: the previous eslint config had 'max-len' turned off, so lines were never wrapped based on
    // length alone - printWidth can't be turned off in oxfmt/prettier, so it's set very high to match
    printWidth: 9999,
    ignorePatterns: [
      '**/node_modules/**/*',
      '**/build/**/*',
      '**/dist/**/*',
      '**/dist-ssr/**/*',
      '**/public/**/*',
    ],
  };
  if (params.oxfmtConfigModifier) {
    return params.oxfmtConfigModifier(config);
  }
  return config;
};
