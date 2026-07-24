// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const globals = require('globals');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    ignores: [
      'dist/**',
      'tmp/**',
      'out-tsc/**',
      'bazel-out/**',
      'node_modules/**',
      'projects/**',
      'src/html-examples/**',
      'src/index.html',
      'src/**/pdf-viewer.html',
      'src/chrome-ext/assets/**',
      'src/**/svg-icon/*.html'
    ]
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      angular.configs.tsRecommended
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
      }
    },
    processor: angular.processInlineTemplates,
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'linebreak-style': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-param-reassign': ['error', { props: false }],
      'no-underscore-dangle': 'off',
      'class-methods-use-this': 'off',
      'comma-dangle': 'off',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          classes: false,
          typedefs: false,
          enums: false
        }
      ],
      'no-useless-constructor': 'off',
      'default-param-last': 'off',
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],
      '@angular-eslint/prefer-standalone': 'off',
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      'complexity': ['error', 10],
      'max-lines': [
        'error',
        {
          max: 300,
          skipBlankLines: true,
          skipComments: true
        }
      ],
      'max-lines-per-function': [
        'error',
        {
          max: 100,
          skipBlankLines: true,
          skipComments: true
        }
      ]
    }
  },
  {
    files: ['**/*.spec.ts'],
    languageOptions: {
      globals: globals.jest
    },
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off'
    }
  },
  {
    files: [
      'src/app/mocks/**/*.ts',
      'src/**/*.mock.ts'
    ],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off'
    }
  },
  {
    files: ['**/*.html'],
    extends: [
      angular.configs.templateRecommended
    ],
    rules: {
      'max-lines': ['error', { max: 200, skipBlankLines: true }]
    }
  }
]);
