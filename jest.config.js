module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
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
