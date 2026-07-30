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
    // NOTE: printWidth 120 chosen as a middle ground between Prettier's default (80, which wraps too
    // aggressively for this codebase's style) and eslint's old 'max-len: off' (which never wrapped) -
    // this keeps existing multi-line JSX/statements that don't fit from being collapsed onto one line
    printWidth: 120,
    ignorePatterns: ['**/node_modules/**/*', '**/build/**/*', '**/dist/**/*', '**/dist-ssr/**/*', '**/public/**/*'],
  };
  if (params.oxfmtConfigModifier) {
    return params.oxfmtConfigModifier(config);
  }
  return config;
};
