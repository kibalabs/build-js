import { removeUndefinedProperties } from '../util.js';

const defaultParams = {
};

export const buildTsConfig = (inputParams = {}) => {
  // eslint-disable-next-line unused-imports/no-unused-vars
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  return {
    compilerOptions: {
      target: 'ES2020',
      jsx: 'react',
      declaration: true,
      declarationMap: true,
      outDir: 'lib',
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictPropertyInitialization: true,
      noImplicitThis: true,
      alwaysStrict: true,
      skipLibCheck: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      noImplicitReturns: false,
      noFallthroughCasesInSwitch: false,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      resolveJsonModule: true,
      module: 'preserve',
      moduleResolution: 'bundler',
    },
  };
};
