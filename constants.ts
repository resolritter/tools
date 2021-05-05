export const availableGenerationModules = ["Redux", "LabelTree"] as const

export const usageText = `
    Usage: tools --generate MODULE SCHEMA_PATH [OUTPUT_PATH]
  
    SCHEMA_PATH: The configuration for generating the module. Can be either a JS or JSON file.
    (optional) OUTPUT_PATH: The path where the generated module will be saved to. If not told, an automatic name will be picked and the file will be saved in the same directory as SCHEMA_PATH.
  `
