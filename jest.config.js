module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: ["posty5-*/src/**/*.ts", "!posty5-*/src/**/*.d.ts", "!posty5-*/dist/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
  testTimeout: 30000, // 30 seconds for API calls
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  watch: false,

  // Stop running tests after the first failure
  //bail: 5,

  forceExit: true,
  maxWorkers: 1,
};
