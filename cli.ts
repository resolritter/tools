import { generate as generateReduxModule } from "./src/code_generator/redux/module"
import { generate as generateTaggedComponentHierarchy } from "./src/code_generator/objects/tagged_component_hierarchy"
import { usageText, availableGenerationModules } from "./constants"

import * as fs from "fs"
import * as path from "path"

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

export function exec(args: {
  ["_"]: [string, string] | [string]
  generate: typeof availableGenerationModules[number]
}) {
  const positionalArgs = args["_"]
  const schemaPath = path.resolve(positionalArgs[0])
  const schemaBaseName = path.basename(schemaPath)
  const schemaFileName =
    schemaBaseName.indexOf(".") === -1
      ? schemaBaseName
      : schemaBaseName.slice(0, schemaBaseName.indexOf("."))

  switch (args.generate) {
    case "Redux": {
      const automaticOutputName = `${schemaFileName}.generated.ts`
      const outputPath =
        positionalArgs[1] ||
        path.join(path.dirname(schemaPath), automaticOutputName)

      console.log(`Generating file at ${outputPath}..`)

      fs.writeFileSync(outputPath, generateReduxModule(require(schemaPath)))
      break
    }
    case "LabelTree": {
      const outputPath =
        positionalArgs[1] ||
        path.join(path.dirname(schemaPath), `${schemaFileName}.generated.json`)

      console.log(`Generating file at ${outputPath}..`)

      fs.writeFileSync(
        outputPath,
        generateTaggedComponentHierarchy(require(schemaPath)),
      )
      break
    }
  }

  console.log("Complete!")
}
