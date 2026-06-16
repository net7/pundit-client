/* eslint-disable */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  globalSetup: 'jest-preset-angular/global-setup',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  // These deps (and their nested node_modules) ship ESM that must be transformed.
  // The `.*` lets a whitelisted scope match anywhere in the path, covering nested
  // node_modules like @pundit/communication/node_modules/@vespaiach/*.
  transformIgnorePatterns: ['node_modules/(?!.*(@net7|@pundit|@angular|rxjs|@vespaiach|\\.mjs$))'],
};
