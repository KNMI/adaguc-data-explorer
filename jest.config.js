/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  // Stands in for webpack's DefinePlugin substitution (see
  // webpack.config.js), which jest never runs.
  globals: {
    __BUILD_DATE__: '1970-01-01T00:00:00.000Z',
  },
};
