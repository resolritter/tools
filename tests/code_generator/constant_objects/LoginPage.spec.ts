import * as fs from "fs"
import { format } from "prettier"
import {
  generate,
  Configuration,
  Node,
} from "../../../src/code_generator/objects/tagged_component_hierarchy"
import { isValidTaggedComponentHierarchyConfiguration } from "../../../src/utils"
import { prettierConfigJson } from "../../utils"

const formFields: Node[] = [
  ["Label", []],
  ["Input", []],
]
const baseConfiguration: Configuration = {
  tree: [
    [
      "Login",
      [
        ["Email", formFields],
        ["Password", formFields],
      ],
    ],
  ],
}

describe("Test code generation", () => {
  it("should match the snapshot", () => {
    expect(
      format(generate(baseConfiguration), prettierConfigJson),
    ).toMatchSnapshot()
  })
})

describe("Test validation through JSON Schema", () => {
  it("should work for a schema configuration valid in TypeScript", () => {
    expect(
      isValidTaggedComponentHierarchyConfiguration(baseConfiguration),
    ).toBeTruthy()
  })

  it("should throw errors for a invalid schema", () => {
    // we don't want the errors to be print during test, so we disable it here and
    // restore it at the end
    const originalConsoleError = console.error
    console.error = jest.fn()

    expect(function () {
      isValidTaggedComponentHierarchyConfiguration({
        // this is incorrect because the tree is specified as an array
        tree: { name: "Root" },
      })
    }).toThrowErrorMatchingInlineSnapshot(
      `"Object supplied is not a valid Configuration"`,
    )

    expect(console.error).toHaveBeenCalled()
    console.error = originalConsoleError
  })
})
