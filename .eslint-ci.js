const path = require("path")
const base = require(path.join(__dirname, ".eslintrc"))
const _ = require("lodash")

module.exports = _.merge(base, {
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
  },
})
