module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  cacheDirectory: '<rootDir>/../node_modules/.cache/jest',
  testMatch: ['<rootDir>/e2e/**/*.test.{js,jsx,ts,tsx}'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  setupFiles: ['./jest.e2e.setup.js'],
  collectCoverage: false,
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  }
};
