import { exec } from "./cli"
import { usageText, availableGenerationModules } from "./constants"

// prettier-ignore
const args = require("yargs")
    .usage(usageText)
    .demand(1)
    .string("generate")
      .describe("generate", "the kind of module you want to generate")
      .choices("generate", availableGenerationModules).argv

exec(args)
