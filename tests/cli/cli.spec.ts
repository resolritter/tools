import { exec, ValidArguments } from "../../cli"
import * as tempy from "tempy"
import * as fs from "fs"
import * as path from "path"

function requiresSchemaAndExecutesCLI(schemaPath: string) {
  return function() {
    const tempFile = tempy.file()

    exec({
      _: [schemaPath, tempFile],
      generate: "Redux",
    })

    expect(fs.existsSync(tempFile)).toBeTruthy()
  }
}

describe("Tests the CLI tool", function() {
  const tempDir = tempy.directory()

  it(
    "works for JSON files",
    requiresSchemaAndExecutesCLI(path.join(__dirname, "fixtures", "todo.schema.json")),
  )

  it(
    "works for JS files",
    requiresSchemaAndExecutesCLI(path.join(__dirname, "fixtures", "todo.schema.js")),
  )
})
