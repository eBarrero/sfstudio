// jest.e2e.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: "jsdom",
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  setupFiles: ["./jest.e2e.setup.js"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,ts,tsx}",
    "../api/src/**/*.{js,ts,tsx}"
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  }
};