const { de } = require("@faker-js/faker");

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
  verbose: true,
  collectCoverage: true,
  detectOpenHandles: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**', 
    '!**/testHelpers.js'
  ],
  // setupFilesAfterEnv: ['./jest.setup.js']
};
