module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    },
    testPathIgnorePatterns: [
        "tests/static/test.js",
    ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/test/"
    ]
};
