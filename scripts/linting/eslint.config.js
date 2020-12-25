module.exports = {
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
  rules: {
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/interface-name-prefix': ['error', 'always'],
    'max-len': 'off',
    'import/prefer-default-export': 'off',
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0 }],
    'lines-between-class-members': 'off',
    'object-curly-newline': ['error', { ImportDeclaration: 'never' }],
    'no-use-before-define': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'no-unused-vars': 'off',
    'prefer-destructuring': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    'arrow-body-style': 'off',
    'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }],
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal'],
      alphabetize: { order: 'asc', caseInsensitive: true },
      pathGroups: [{ pattern: 'react', group: 'external', position: 'before' }],
      pathGroupsExcludedImportTypes: ['react'],
      'newlines-between': 'always',
    }],
  },
};
