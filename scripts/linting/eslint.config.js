import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';
// import react from 'eslint-plugin-react';

import { removeUndefinedProperties } from '../util.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});


export const buildEslintConfig = (inputParams = {}) => {
  const defaultParams = {
  };
  // eslint-disable-next-line unused-imports/no-unused-vars
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  return defineConfig([
    js.configs.recommended,
    tseslint.configs.recommended,
    // NOTE(krishan711): react is imported by airbnb
    // react.configs.flat.recommended,
    reactHooks.configs['recommended-latest'],
    globalIgnores([
      '**/node_modules/**/*',
      '**/build/**/*',
      '**/dist/**/*',
      '**/dist-ssr/**/*',
      '**/public/**/*',
    ]), {
      // NOTE(krishan711): airbnb doesn't support 9 yet. when it does a lot of this can be cleaned up
      extends: fixupConfigRules(compat.extends(
        'airbnb',
      )),
      // extends: [
      //   importPlugin.flatConfigs.recommended,
      //   importPlugin.flatConfigs.typescript,
      // ],
      plugins: {
        'unused-imports': unusedImports,
        '@stylistic': stylistic,
      },
      languageOptions: {
        parser: tsParser,
        ecmaVersion: 2018,
        sourceType: 'module',
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
        globals: {
          ...globals.browser,
          ...globals.node,
          myCustomGlobal: 'readonly',
        },
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'no-shadow': 'off',
        '@stylistic/indent': ['error', 2],
        '@typescript-eslint/no-shadow': ['error'],
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'always' }],
        '@typescript-eslint/no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': ['error', {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        }],
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
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          pathGroups: [{
            pattern: 'react',
            group: 'external',
            position: 'before',
          }, {
            pattern: 'react-dom',
            group: 'external',
            position: 'before',
          }, {
            pattern: '@src/**',
            group: 'internal',
          }],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
        }],
        'jsx-a11y/anchor-is-valid': 'off',
        'no-underscore-dangle': ['error', { allow: ['__filename', '__dirname'] }],
      },
    }, {
      files: ['**/*.tsx'],
      rules: {
        'react/prop-types': 'off',
      },
    },
  ]);
};
