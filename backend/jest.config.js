/**
 * Jest Configuration for OnlyStudy Backend Tests
 */

// Test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_jest_testing_12345';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_jest_testing_12345';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_secret';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.RTMP_URL = 'rtmp://localhost/live';

// Silence console logs during tests (optional, for cleaner output)
// Note: jest global is not available in config file, so we skip this in config
// The silencing is handled in tests/setup.js instead

module.exports = {
  testEnvironment: 'node',
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 30000,
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'clover'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Test matching patterns
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/setup.js',
  ],
  
  // Module path aliases (if using babel or webpack aliases)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};

