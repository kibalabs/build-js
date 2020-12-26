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
      'import/ignore': 'react',
    },
    ignorePatterns: [
      '**/node_modules/**',
      'build/**',
      'dist/**',
    ],
    rules: {
      '@typescript-eslint/indent': ['error', 2],
      '@typescript-eslint/no-empty-interface': 'off',
      'max-len': 'off',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0 }],
      'lines-between-class-members': 'off',
      'object-curly-newline': ['error', { ImportDeclaration: 'never' }],
      'no-use-before-define': 'off',
      'import/extensions': 'off',
      'no-unused-vars': 'off',
      'prefer-destructuring': 'off',
      'arrow-body-style': 'off',
      'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }],
      'import/prefer-default-export': 'off',
      'import/no-unresolved': 'off',
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal'],
        alphabetize: { order: 'asc', caseInsensitive: true },
        pathGroups: [
          { pattern: 'react', group: 'external', position: 'before' },
          { pattern: '@src/**', group: 'internal' },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
      }],
    },
  };
};
