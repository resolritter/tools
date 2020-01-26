const webpack = require("webpack")
const path = require("path")
const UglifyPlugin = require("uglifyjs-webpack-plugin")

const _ = require("lodash")
const { libraryName } = require(path.resolve(__dirname, "../package.json"))
const base = require(path.join(__dirname, "webpack.config.base"))

const configuration = base.createConfiguration({
  entry: {
    [libraryName]: path.resolve("src/cli.ts"),
  },
  devtool: "hidden-source-map",
  mode: "production",
  output: {
    path: path.resolve("lib"),
    filename: "[name].js",
    library: libraryName,
    libraryTarget: "umd",
    umdNamedDefine: true,
    globalObject: '(typeof global!=="undefined"?global:window)',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new UglifyPlugin({
        uglifyOptions: {
          compress: true,
          mangle: true,
          output: {
            comments: false,
          },
        },
        sourceMap: false,
      }),
    ],
  },
  plugins: [new webpack.HashedModuleIdsPlugin()],
})

if (otherConfiguration) {
  config = _.merge(config, otherConfiguration)
}
return config

module.exports = configuration
