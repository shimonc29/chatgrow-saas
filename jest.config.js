export default {
  // Use different configurations for client and server
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/client/**/*.test.{js,jsx}'],
      setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.js'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/client/__mocks__/fileMock.js',
      },
      transform: {
        '^.+\\.(js|jsx)$': [
          'babel-jest',
          {
            presets: [
              ['@babel/preset-env', { targets: { node: 'current' } }],
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
          },
        ],
      },
      collectCoverageFrom: [
        'client/src/**/*.{js,jsx}',
        '!client/src/main.jsx',
        '!client/src/**/*.stories.{js,jsx}',
        '!client/src/**/__mocks__/**',
      ],
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
      collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js',
        '!src/**/*.test.js',
        '!src/tests/**',
      ],
    },
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
};
