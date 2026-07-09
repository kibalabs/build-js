import { removeUndefinedProperties } from '../util.js';

export const buildOxfmtConfig = (inputParams = {}) => {
  const defaultParams = {};

  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const config = {
    singleQuote: true,
    jsxSingleQuote: true,
    // NOTE: pins react/react-dom into their own group at the very top, matching the previous eslint
    // config's import/order pathGroups (which pulled 'react'/'react-dom' before other externals)
    sortImports: {
      customGroups: [{ groupName: 'react', elementNamePattern: ['react', 'react-dom'] }],
      groups: ['react', 'builtin', 'external', ['internal', 'subpath'], ['parent', 'sibling', 'index'], 'style', 'unknown'],
    },
    // NOTE: the previous eslint config had 'max-len' turned off, so lines were never wrapped based on
    // length alone - oxfmt caps printWidth at 320 (a true "never wrap" isn't supported), so this is the
    // closest approximation; lines longer than 320 chars will still get wrapped
    printWidth: 320,
    ignorePatterns: ['**/node_modules/**/*', '**/build/**/*', '**/dist/**/*', '**/dist-ssr/**/*', '**/public/**/*'],
  };
  if (params.oxfmtConfigModifier) {
    return params.oxfmtConfigModifier(config);
  }
  return config;
};
