module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^../../../shared/(.*)$': '<rootDir>/../../shared/$1',
    '^../../shared/(.*)$': '<rootDir>/../../shared/$1'
  }
};
