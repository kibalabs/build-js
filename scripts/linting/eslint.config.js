const defaultParams = {
};

module.exports = (inputParams = {}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const params = { ...defaultParams, ...inputParams };
  return {
    env: {
      browser: true,
      es2021: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'airbnb-base',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    plugins: [
    ],
    settings: {
      react: {
        version: 'detect',
      },
    },
    ignorePatterns: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
    ],
    rules: {
      // NOTE(krishan711): next two lines are weird because of https://stackoverflow.com/questions/63961803/eslint-says-all-enums-in-typescript-app-are-already-declared-in-the-upper-scope
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/indent': ['error', 2],
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'max-len': 'off',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0 }],
      'lines-between-class-members': 'off',
      'object-curly-newline': ['error', { ImportDeclaration: 'never' }],
      'no-use-before-define': 'off',
      'import/extensions': 'off',
      'no-unused-vars': 'off',
      'no-nested-ternary': 'off',
      'prefer-destructuring': 'off',
      'arrow-body-style': 'off',
      'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }],
      'import/prefer-default-export': 'off',
      'import/no-unresolved': 'off',
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal'],
        alphabetize: { order: 'asc', caseInsensitive: true },
        pathGroups: [
          // TODO(krishan711): find out how to prevent these causing newlines
          { pattern: 'react', group: 'external', position: 'before' },
          { pattern: 'react-dom', group: 'external', position: 'before' },
          { pattern: '@src/**', group: 'internal' },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
      }],
    },
    overrides: [{
      files: ['**/*.tsx'],
      rules: {
        'react/prop-types': 'off',
      },
    }],
  };
};
