/* eslint-disable */
module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    "airbnb-base",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "linebreak-style": "off",
    "import/no-unresolved": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "import/extensions": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "no-param-reassign": ["error", { "props": false }],
    "import/prefer-default-export": "off",
    "no-underscore-dangle": "off",
    "class-methods-use-this": "off",
    "no-useless-constructor": "off",
    "comma-dangle": "off",
  },
};
