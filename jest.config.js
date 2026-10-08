/* eslint-disable */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  // Resolve tsconfig baseUrl ('./') absolute imports like `src/app/...`.
  modulePaths: ['<rootDir>'],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  moduleNameMapper: {
    // The networking layer must not be loaded by unit tests — stub it. See the mock.
    // Only the exact `src/communication` specifier is mapped: specs inside
    // src/communication import siblings by relative path and get the real code.
    '^src/communication$': '<rootDir>/src/testing/communication.mock.ts',
  },
  // Remaining deps ship ESM that Jest must transform (it ignores node_modules by default).
  transformIgnorePatterns: ['node_modules/(?!.*(@net7|@angular|rxjs|\\.mjs$))'],
};
