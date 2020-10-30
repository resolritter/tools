import { exec } from "../../cli"
import * as tempy from "tempy"
import * as fs from "fs"
import * as path from "path"

function runCLI(schemaPath: string) {
  return function () {
    const tempFile = tempy.file()

    exec({
      _: [schemaPath, tempFile],
      generate: "Redux",
    })

    expect(fs.existsSync(tempFile)).toBeTruthy()
  }
}

function runCLIOptionalPath(schemaFixturePath: string) {
  return function () {
    const tempDir = tempy.directory()
    const schemaPath = path.join(tempDir, path.basename(schemaFixturePath))
    fs.copyFileSync(schemaFixturePath, schemaPath)

    exec({
      _: [schemaPath],
      generate: "Redux",
    })

    const files = fs.readdirSync(tempDir)
    console.debug(files)

    expect(files.length).toBe(2)
  }
}

describe("Tests the CLI tool", function () {
  const tempDir = tempy.directory()

  it(
    "works for JSON files",
    runCLI(path.join(__dirname, "fixtures", "todo.schema.json")),
  )

  it(
    "works for JS files",
    runCLI(path.join(__dirname, "fixtures", "todo.schema.js")),
  )

  it(
    "automatically file in the same directory if output path is omitted",
    runCLIOptionalPath(path.join(__dirname, "fixtures", "todo.schema.js")),
  )
})
