const webpack = require("webpack")
const merge = require("lodash").merge
const path = require("path")

function extendConfiguration(otherConfiguration) {
  let config = {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loaders: ["babel-loader", "ts-loader"],
          exclude: /(node_modules|tests)/,
        },
        {
          test: /\.jsx?$/,
          loader: ["babel-loader"],
          exclude: /(node_modules|tests)/,
        },
      ],
    },
    resolve: {
      modules: [path.resolve("."), path.resolve("node_modules")],
      extensions: [".json", ".js", ".jsx", ".ts", ".tsx"],
    },
    node: {
      fs: "empty",
    },
  }
  if (otherConfiguration) {
    config = merge(config, otherConfiguration)
  }
  return config
}

module.exports = {
  extendConfiguration,
}
