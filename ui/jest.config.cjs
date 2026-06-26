/** Jest configuration for the SalesCatalog UI (ts-jest + jsdom). */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.polyfills.cjs"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  moduleNameMapper: {
    // Stub static asset imports.
    "\\.(css|less|scss|svg|png|jpg|jpeg|gif|webp)$": "<rootDir>/test/fileMock.cjs",
    // The real config uses Vite's import.meta.env, unavailable under Jest;
    // swap it for a static stub during tests.
    "^.*/app/config$": "<rootDir>/test/configMock.ts",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          // Tests don't need the strict unused checks the build enforces.
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
      },
    ],
  },
};
