const path = require("path");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, "src/index.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    library: "roov",
    libraryTarget: "umd",
    globalObject: `typeof self !== 'undefined' ? self : this`
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
    ],
  },
  mode: "production",
  devtool: "sourceMap",
  optimization: {
        minimizer: [new TerserPlugin({
            cache: true,
            parallel: true,
            terserOptions: {
                output: {
                    comments: false
                }
            }
        })]
    }
};
