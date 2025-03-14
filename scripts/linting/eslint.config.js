import { removeUndefinedProperties } from '../util.js';

export const buildEslintConfig = (inputParams = {}) => {
  const defaultParams = {
  };
  // eslint-disable-next-line unused-imports/no-unused-vars
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
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
      'airbnb',
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
      'unused-imports',
      '@stylistic',
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
      '**/dist-ssr/**',
      '**/public/**',
    ],
    rules: {
      // NOTE(krishan711): next two lines are weird because of https://stackoverflow.com/questions/63961803/eslint-says-all-enums-in-typescript-app-are-already-declared-in-the-upper-scope
      'no-shadow': 'off',
      '@stylistic/indent': ['error', 2],
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-empty-object-type': ['error', {
        allowInterfaces: 'always',
      }],
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
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
      'max-classes-per-file': 'off',
      'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }],
      'jsx-quotes': ['error', 'prefer-single'],
      'react/self-closing-comp': ['error', { component: true, html: true }],
      'react/jsx-first-prop-new-line': ['error', 'multiline'],
      // NOTE(krishan711): the below doesn't work. keep an eye on https://github.com/yannickcr/eslint-plugin-react/issues/2735
      // 'react/jsx-max-props-per-line': ['error', { maximum: 2, when: 'always' }],
      // 'react/jsx-max-props-per-line': ['error', { maximum: 1, when: 'multiline' }],
      'react/jsx-tag-spacing': ['error', { beforeClosing: 'never' }],
      'react/jsx-closing-tag-location': 'error',
      'react/jsx-closing-bracket-location': ['error', 'line-aligned'],
      'react/jsx-one-expression-per-line': ['error', { allow: 'single-child' }],
      'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.jsx'] }],
      'react/jsx-boolean-value': ['warn', 'always'],
      'react/jsx-fragments': ['warn', 'element'],
      'react/jsx-no-useless-fragment': 'off',
      'react/destructuring-assignment': 'off',
      'react/require-default-props': 'off',
      'react/jsx-wrap-multilines': ['error', {
        declaration: 'parens-new-line',
        assignment: 'parens-new-line',
        return: 'parens-new-line',
        arrow: 'parens-new-line',
        condition: 'parens-new-line',
        logical: 'parens-new-line',
        prop: 'parens-new-line',
      }],
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
      'jsx-a11y/anchor-is-valid': 'off',
      'no-underscore-dangle': ['error', { allow: ['__dirname'] }],
    },
    overrides: [{
      files: ['**/*.tsx'],
      rules: {
        'react/prop-types': 'off',
      },
    }],
    // linterOptions: {
    //   reportUnusedDisableDirectives: 'warn',
    // },
  };
};
