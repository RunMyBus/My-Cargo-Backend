module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
  verbose: true,
  collectCoverage: true,
  detectOpenHandles: true,
  forceExit: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    'controllers/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**', 
    '!**/testHelpers.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  }
};
