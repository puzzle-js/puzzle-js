const path = require('path');

module.exports = {
  entry: path.join(__dirname, './index.ts'),
  mode: "production",
  output: {
    filename: "puzzle.min.js",
    path: path.join(__dirname, '../../dist/lib'),
  },
  resolve: {

    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {test: /\.tsx?$/, loader: "ts-loader"}
    ]
  },
};
