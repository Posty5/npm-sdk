/** What both projects share. */
const project = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
};

module.exports = {
  // Separate projects because ts-jest caches its compiler settings per Jest project,
  // not per transform entry: @posty5/mcp must compile strict (zod's inferred
  // types need strictNullChecks), every other suite keeps ts-jest's defaults.
  projects: [
    {
      ...project,
      displayName: "sdk",
      roots: ["<rootDir>/__tests__"],
      testMatch: ["**/__tests__/**/*.test.ts"],
      testPathIgnorePatterns: ["/node_modules/", "[\\\\/]__tests__[\\\\/]mcp[\\\\/]"],
    },
    {
      ...project,
      displayName: "mcp",
      roots: ["<rootDir>/__tests__/mcp"],
      testMatch: ["**/__tests__/mcp/**/*.test.ts"],
      transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/__tests__/mcp/tsconfig.json" }] },
    },
    {
      // @posty5/qr-design: pure functions, no live API, so no root setup.ts.
      // Its jsdom suite opts in per file with a @jest-environment docblock.
      preset: "ts-jest",
      testEnvironment: "node",
      displayName: "qr-design",
      roots: ["<rootDir>/posty5-qr-design/__tests__"],
      testMatch: ["**/*.test.ts"],
      transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/posty5-qr-design/__tests__/tsconfig.json" }] },
    },
  ],
  collectCoverageFrom: ["posty5-*/src/**/*.ts", "!posty5-*/src/**/*.d.ts", "!posty5-*/dist/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
  testTimeout: 30000, // 30 seconds for API calls
  watch: false,

  // Stop running tests after the first failure
  //bail: 5,

  forceExit: true,
  maxWorkers: 1,
};
