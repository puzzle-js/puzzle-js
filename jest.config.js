module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 80,
            lines: 86,
            statements: 85
        }
    },
    testPathIgnorePatterns: [
        "tests/static/test.js",
    ],
    collectCoverageFrom: [
        "src/**/*.ts",
    ],
    forceCoverageMatch: [
        "src/lib/**/*.ts"
    ],
    verbose: false
};
