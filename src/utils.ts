import * as fs from "fs"
import * as path from "path"
import * as TJS from "typescript-json-schema"
import { JSONSchema7 } from "json-schema"
const findUp = require("find-up").sync
const Ajv = require("ajv")
const ajvSingleton = new Ajv()
const execSync = require("child_process").execSync

type AssertObjectOfTypeConfiguration = {
  filePath: string
  // https://github.com/vega/ts-json-schema-generator/issues/101#issuecomment-501321152
  // Each implementation has some shortcomings at the moment
  // "typescript-json-schema" -> can't generate circular types
  // "ts-json-schema-generator" -> more recent, but can't generated conditional or generic types
  implementation: "ts-json-schema-generator" | "typescript-json-schema"
}
/**
 * Takes any kind of object and verifies if it matches the target named
 * TypeScript type's jsonSchemaFromTSType.
 *
 * @param objectToValidate - the "untyped" object.
 * @param typeName - the target TypeScript type it supposedly is.
 * @param object: AssertObjectOfTypeConfiguration - extra configuration.
 * @return {boolean} [TODO:description]
 */
export function assertObjectOfType(
  objectToValidate: object,
  typeName: string,
  { filePath, implementation }: AssertObjectOfTypeConfiguration,
): boolean {
  if (!fs.existsSync) {
    throw new Error(`File ${filePath} does not exist`)
  }

  let jsonSchemaFromTSType: JSONSchema7 | undefined
  try {
    switch (implementation) {
      case "ts-json-schema-generator": {
        const generatorBinPath = path.resolve(
          __dirname,
          "./../node_modules/.bin/ts-json-schema-generator",
        )
        const result = execSync(
          `${generatorBinPath} --path '${filePath}.ts' --type '${typeName}' --expose all --no-top-ref`,
          { stdio: "pipe" },
        )
        jsonSchemaFromTSType = JSON.parse(result) as JSONSchema7
        break
      }
      case "typescript-json-schema": {
        const tsConfigPath =
          findUp(["tsconfig.json"], {
            cwd: path.dirname(filePath),
          }) || undefined
        const compilerOptions = ((tsConfigPath
          ? require(tsConfigPath)
          : {}) as unknown) as TJS.CompilerOptions

        const tsProgram = TJS.getProgramFromFiles([filePath])
        const maybeValidatedSchema = TJS.generateSchema(tsProgram, typeName)
        if (maybeValidatedSchema) {
          jsonSchemaFromTSType = maybeValidatedSchema as JSONSchema7
        }
        break
      }
    }
  } catch (err) {
    console.error(
      `It was not possible to generate the JSON schema for ${typeName} using '${implementation}'.`,
    )
    throw err
  }

  // validates that the untyped object is of the same type by comparing it's
  // structure to the jsonSchemaFromTSType at runtime
  const validate = ajvSingleton.compile(jsonSchemaFromTSType)
  const isValid = validate(objectToValidate)

  if (!isValid) {
    console.error(validate.errors)
    throw new Error(`Object supplied is not a valid ${typeName}`)
  }

  return true
}

export function isValidReduxModuleConfiguration(objectToValidate: object) {
  return assertObjectOfType(objectToValidate, "UserProvidedConfiguration", {
    filePath: path.resolve("./src/code_generator/redux/module.ts"),
    implementation: "typescript-json-schema",
  })
}

export function isValidTaggedComponentHierarchyConfiguration(
  objectToValidate: object,
) {
  return assertObjectOfType(objectToValidate, "Configuration", {
    filePath: path.resolve(
      "./src/code_generator/objects/tagged_component_hierarchy",
    ),
    implementation: "ts-json-schema-generator",
  })
}
