import { generate as generateReduxModule } from "./src/code_generator/redux/module"
import { generate as generateTaggedComponentHierarchy } from "./src/code_generator/objects/tagged_component_hierarchy"

const availableGenerationModules = ["Redux", "LabelTree"] as const

import * as fs from "fs"
import * as path from "path"

const usageText = `
  Usage: ts-tools --generate [generation module] <schema_path> <output_path>

  <schema_path>: The configuration for generating the module. Can be either a JS or JSON file.
  <output_path>: The path where the generated module will be saved to.
`

function exitWithError(
  errorMessage: string,
  options: { printUsage?: boolean; exitCode?: number } = {},
) {
  console.error(errorMessage)
  if (options.printUsage ?? true) {
    console.log(usageText)
  }
  process.exit(options.exitCode ?? 1)
}

type SchemaPath = string
type OutputPath = string
export type ValidArguments = {
  ["_"]: [SchemaPath, OutputPath]
  generate: typeof availableGenerationModules[number]
}

export function run() {
  // prettier-ignore
  const args: ValidArguments = require("yargs")
    .usage(usageText)
    .demand(2)
    .string("generate")
      .describe("generate", "the kind of module you want to generate")
      .choices("generate", availableGenerationModules).argv

  return exec(args)
}

export function exec(args: ValidArguments) {
  let [schemaPath, outputPath] = args["_"]
    .slice(0, 2)
    .map((_path: string) => path.resolve(_path))

  if (!fs.existsSync(schemaPath)) {
    exitWithError(`ERR: Schema path '${schemaPath}' does not exist.`)
  }

  const targetDirectory = path.dirname(outputPath)
  if (!fs.existsSync(targetDirectory)) {
    exitWithError(`ERR: Output directory '${targetDirectory}' does not exist.`)
  }

  console.log(`Generating file at ${outputPath}..`)

  switch (args.generate) {
    case "Redux": {
      fs.writeFileSync(outputPath, generateReduxModule(require(schemaPath)))
      break
    }
    case "LabelTree": {
      fs.writeFileSync(
        outputPath,
        generateTaggedComponentHierarchy(require(schemaPath)),
      )
      break
    }
    default:
      exitWithError(`Invalid generation choice: ${args.generate}`, {
        printUsage: true,
      })
  }

  console.log("Complete!")
}

if (typeof window === "undefined" && require.main === module) {
  run()
}
