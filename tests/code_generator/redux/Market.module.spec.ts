import * as fs from "fs"
import { format } from "prettier"
import { generate } from "../../../src/code_generator/redux/module"
import { isValidReduxModuleConfiguration } from "../../../src/utils"
import { prettierConfig } from "../../utils"
import { UserProvidedConfiguration } from "../../../src/code_generator/redux/module"

export enum Actions {
  "Buy" = "Buy",
  "Sell" = "Sell",
  "Return" = "Return",
}

const baseProductInformation = `{ id: IProduct["id"], discount: IProduct["discount"], date: IProduct["date"] }[]`
const baseServerReturn = `IProduct[]`

const baseConfiguration: UserProvidedConfiguration<Actions> = {
  actions: Object.keys(Actions),
  actionToPayload: {
    Buy: baseProductInformation,
    Sell: baseProductInformation,
    Return: baseProductInformation,
  },
  actionToServerResponseData: {
    Buy: baseServerReturn,
    Sell: baseServerReturn,
    Return: baseServerReturn,
  },
  extraImports: ['import { IProduct } from "src/Types"'],
  withDerivedActionCreators: [
    {
      generateForVariants: ["Start"],
      mapperTypeImportName: "ActionToActionCreator",
      mapperTypeImportLine:
        'import { ActionToActionCreator } from "./modules/Market"',
    },
  ],
}

describe("Test the Redux code generator", () => {
  it("should match the snapshot with metadata", () => {
    expect(
      format(
        generate<Actions>({
          ...baseConfiguration,
          allowsMetadata: true,
        }),
        prettierConfig,
      ),
    ).toMatchSnapshot()
  })

  it("should match the snapshot with metadata", () => {
    expect(
      format(generate<Actions>(baseConfiguration), prettierConfig),
    ).toMatchSnapshot()
  })
})

describe("Test if the schema validation for Configuration works on foreign objects", () => {
  it("should work for a schema configuration valid in TypeScript", () => {
    expect(isValidReduxModuleConfiguration(baseConfiguration)).toBeTruthy()
  })

  it("should throw errors for a invalid schema", () => {
    // we don't want the errors to be print during test, so we disable it here and
    // restore it at the end
    const originalConsoleError = console.error
    console.error = jest.fn()

    expect(function() {
      isValidReduxModuleConfiguration({
        // this is incorrect because "Actions" are specified as an array
        actions: { Buy: "Buy" },
      })
    }).toThrowErrorMatchingInlineSnapshot(
      `"Object supplied is not a valid UserProvidedConfiguration"`,
    )

    expect(console.error).toHaveBeenCalled()
    console.error = originalConsoleError
  })
})
