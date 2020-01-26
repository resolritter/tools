const webpack = require("webpack")
const path = require("path")
const base = require("./webpack.config.base")
const WebpackWatchedGlobEntries = require("webpack-watched-glob-entries-plugin")

let config = base.createConfiguration({
  entry: WebpackWatchedGlobEntries.getEntries([path.resolve("./src/**/*.ts")]),
  devtool: "source-map",
  mode: "development",
  watch: true,
  output: {
    path: path.resolve("debug"),
    filename: "[name].js",
    libraryTarget: "umd",
    umdNamedDefine: true,
    globalObject: '(typeof global!=="undefined"?global:window)',
  },
})

module.exports = config
