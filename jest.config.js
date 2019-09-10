module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transformIgnorePatterns: ["node_modules/(?!(@puzzle-js/*)/)"],
  testPathIgnorePatterns: [
    "tests/static/test.js",
  ]
};
