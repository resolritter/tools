import { toReduxActionName } from "./utils"

/*
  Outcomes for actions. For instance, a Request action has three outcomes:
   - Success - The request was sent and it received a response
   - Error - The request either wasn't sent due to an error or received a bad response
   - Abort - The request was cancelled before being sent to the server
  https://github.com/klis87/redux-saga-requests/blob/master/packages/redux-saga-requests/src/constants.js
*/
type UpperCamelCaseTypeName = string
type ActionTypeSuffix = string
const suffixOutcomes: Array<[UpperCamelCaseTypeName, ActionTypeSuffix]> = [
  ["Success", "_SUCCESS"],
  ["Error", "_ERROR"],
  ["Abort", "_ABORT"],
]

/*
  actionModifiers are properties which relate to a common base type.
  Taking, for instance, a set of actions:
  - Each action has a payload
  - Each action *can* be turned into a request; that being the case, you also
  have a mapping from the request to a matching response data...
*/
type ActionModifier = {
  isReduxActionName: boolean
  suffixOutcomes?: typeof suffixOutcomes
}
const actionModifiers: [string, ActionModifier][] = [
  ["Request", { isReduxActionName: true, suffixOutcomes }],
  ["Payload", { isReduxActionName: false }],
  ["ResponseData", { isReduxActionName: false }],
  /*
    Stages in which an action goes through in a Saga:
    - Start, where it'll be put in transit to later picked up by the middleware and reduced
    - Done, where we signal, through the Saga, that an action has been reduced with a GOOD outcome
    - Error, where we signal, through the Saga, that an action has been reduced with a BAD outcome
  */
  ["Start", { isReduxActionName: true }],
  ["Done", { isReduxActionName: true }],
  ["Error", { isReduxActionName: true }],
]

const reduxActionModifiers = actionModifiers.filter(
  ([, { isReduxActionName }]) => isReduxActionName,
)
const outcomeActionModifiers = actionModifiers.filter(
  ([, { suffixOutcomes }]) => suffixOutcomes,
)

const ResponseMetadataTypeName = "ResponseMetadata"
const MetadataTypeName = "MetadataType"

/*
  Since actionModifiers relate to a common base type, it's useful to provide a way to
  automatically generates their type creators which also related to the base
  type's action creators, plus may add some extra fields.
*/
type ParameterName = string
type ParameterType = string
type VariantsActionCreatorsConfiguration = {
  mapperTypeImportName: string
  mapperTypeImportLine: string
  generateForVariants: string[]
  extraParameters?: [ParameterName, ParameterType][]
}

type RequiredConfiguration<A extends string> = {
  actions: string[]
  actionToPayload: { [K in A]: string }
  actionToServerResponseData: { [K in A]: string }
}

export interface UserProvidedConfiguration<A extends string>
  extends RequiredConfiguration<A> {
  actionsName?: string
  actionsNameSingular?: string
  allowsMetadata?: boolean
  extraImports?: string[]
  withDerivedActionCreators?: VariantsActionCreatorsConfiguration[]
}

// Represents the schema after it has been filled with the necessary information
// for code generation, as the user-defined configuration has optional values.
type CompleteConfiguration<A extends string> = Required<
  UserProvidedConfiguration<A>
> & { actionExtends: string }

/**
 * Takes the UserProvidedConfiguration and provides defaults where necessary, in
 * addition to other derivable fields from the provided configuration.
 *
 * @param partialConf - The user defined configuration
 * @returns configuration with defaults for non-provided values and other
 *
 */
function fillConfigurationDefaults<A extends string>(
  partialConf: UserProvidedConfiguration<A>,
): CompleteConfiguration<A> {
  const conf = { ...partialConf } as CompleteConfiguration<A>

  conf.actionsNameSingular = conf.actionsNameSingular ?? "Action"
  conf.actionsName = conf.actionsName ?? `${conf.actionsNameSingular}s`
  conf.actionExtends = conf.allowsMetadata
    ? `<${MetadataTypeName}> extends Action, WithMetadata<${MetadataTypeName}>`
    : ""
  conf.extraImports = conf.extraImports ?? []
  conf.withDerivedActionCreators = conf.withDerivedActionCreators ?? []

  return conf
}

/**
 * Generates the ES module code for a single Redux module.
 *
 * @param conf - The *whole* configuration needed to generate every section of
 * the module. It's the UserDefined configuration, plus defaults and other fields
 * pre-processed.
 * @returns the module's code with some helpful suggested imports as a comment.
 *
 */
export function generate<A extends string>(
  conf: UserProvidedConfiguration<A>,
): string {
  const {
    actions,
    actionsName,
    actionsNameSingular,
    actionExtends,
    actionToPayload,
    actionToServerResponseData,
    extraImports,
    allowsMetadata,
    withDerivedActionCreators,
  } = fillConfigurationDefaults<A>(conf)

  function toActionType(action: string): string {
    const defaultName = `${action}${actionsNameSingular}`
    return allowsMetadata ? `${defaultName}WithMetadata` : defaultName
  }

  function toPrefixedType(prefix: string, action: string): string {
    return `${prefix}${action}`
  }

  function toPrefixedTypeVariant(prefix: string): string {
    return `${prefix}T`
  }

  function toMatchingPatternType(prefix: string, action: string): string {
    return `Is${prefix}${action}`
  }

  function toConcreteMapperObject(modifier: string): string {
    return `${modifier}${actionsNameSingular}`
  }

  function toActionCreatorObjectGeneratorFunction(modifier: string): string {
    return `Generate${modifier}ActionCreator`
  }

  function toActionCreatorFunction(modifier: string): string {
    return `to${modifier}ActionCreator`
  }

  const namedExports = `
    Request${actionsNameSingular},
    ServerRequest${actionsNameSingular}T,
    BaseSuccessServerResponse${actionsNameSingular},
    BaseErrorServerResponse${actionsNameSingular},
    ServerResponse${actionsNameSingular},
    ${toPrefixedTypeVariant("Request")},
    ${actionsName},
    ${actions.reduce(
      (acc, a) => `${acc}
      ${toActionType(a)},`,
      "",
    )}
    ${actions.reduce(
      (acc, a) => `${acc}
      ${toPrefixedType("Payload", a)},`,
      "",
    )}
  `

  // prettier-ignore
  return `

  /*
  You'll likely want those at the top of the file:

  import { ${namedExports} } from ""

  export { ${namedExports} }
  */

  import { Action } from "redux"
  ${extraImports.join("\n")}
  ${withDerivedActionCreators.reduce((acc, { mapperTypeImportLine }) => `${acc}\n${mapperTypeImportLine}`, "")}

  interface ServerResponseWith<T> extends Response {
    data: T
  }
  interface WithMetadata<T> {
    meta: T
  }
  
  interface ResponseMetadata<T> {
    meta: {
      requestAction: {
        contents: WithMetadata<T>
      }
    }
  }

  export enum ${actionsName} {
    ${actions.reduce(
      (acc, a) => `
      ${acc}
      "${toReduxActionName(a)}" = "${toReduxActionName(a)}",`,
      "",
    )}
  }

  ${actions.reduce(
    (acc, a) => `${acc}

    export type ${toPrefixedType("Payload", a)} = ${actionToPayload[a as A]}
    export interface ${toActionType(a)}${actionExtends} {
      type: ${actionsName}.${toReduxActionName(a)},
      payload: ${toPrefixedType("Payload", a)}
    }
    export type ${toPrefixedType("ResponseData", a)} = ${actionToServerResponseData[a as A]}
    
    ${actionModifiers.reduce(
      (var_acc, [modifier, opts]) => `${var_acc}

      export type ${toMatchingPatternType(
        modifier,
        a,
      )}<A extends ${actionsName}> = A extends ${actionsName}.${toReduxActionName(a)}
        ? ${opts.isReduxActionName ? `"${toReduxActionName(toPrefixedType(modifier, a))}"` : toPrefixedType(modifier, a)}
        : never
      `,
      "",
    )}
  `,
    "",
  )}

    ${actionModifiers.reduce(
    (acc, [modifier,]) => `${acc}

    export type ${toPrefixedTypeVariant(modifier)}<A extends ${actionsName}> =
      ${actions.reduce(
        (acc, a) => `${acc}
      | ${toMatchingPatternType(modifier, a)}<A>
      `,
      "")}
  `,
    "",
  )}

  /*
  The stringified actionModifiers are those whose "type" is used at runtime, and
  mapped through a concrete object.  This is where e.g.
  RequestAction[Actions.LoadShoppingCart] is enabled, because RequestAction has
  to be hashable and concrete.
  */
  ${reduxActionModifiers.reduce(
    (acc, [modifier,]) => `${acc}

    export const ${modifier}${actionsNameSingular}: {
      [A in ${actionsName}]: ${toPrefixedTypeVariant(modifier)}<A>
    } = {
      ${actions.reduce(
        (acc, a) => `${acc}
      "${toReduxActionName(a)}": "${toReduxActionName(toPrefixedType(modifier, a))}",
      `,
      "")}
    }
    `,
  "")}

  ${outcomeActionModifiers.reduce(
    (acc, [modifier, { suffixOutcomes }]) => `${acc}
    ${suffixOutcomes!.reduce((acc, [pascalCaseName, suffix]) => `${acc}
      ${actions.reduce(
        (var_acc, a) => `${var_acc}
      
        export type ${pascalCaseName}${toMatchingPatternType(
          modifier,
          a,
        )}<A extends ${actionsName}> = A extends ${actionsName}.${toReduxActionName(a)}
          ? "${toReduxActionName(toPrefixedType(modifier, a))}${suffix}"
          : never
        `,
        "",
      )}

      export type ${pascalCaseName}${toPrefixedTypeVariant(modifier)}<A extends ${actionsName}> =
        ${actions.reduce(
          (acc, a) => `${acc}
        | ${pascalCaseName}${toMatchingPatternType(modifier, a)}<A>
        `,
        "")}

      export const ${pascalCaseName}${modifier}${actionsNameSingular}: {
        [A in ${actionsName}]: ${pascalCaseName}${toPrefixedTypeVariant(modifier)}<A>
      } = {
        ${actions.reduce(
          (acc, a) => `${acc}
        "${toReduxActionName(a)}": "${toReduxActionName(toPrefixedType(modifier, a))}${suffix}",
        `,
        "")}
      }
      `,
    "")}
    `,
  "")}

  /*
    Request types
    Actions containing the server request's body.
  */

  export type ServerRequest${actionsNameSingular}T<
    A extends ${actionsName}
  > = {
    type: ${toPrefixedTypeVariant("Request")}<A>
    request: RequestInit & { url: string }
    contents: ${toPrefixedTypeVariant("Payload")}<A>
  }

  /*
    Response Types
    ${actionsNameSingular} containing the API response, within its body, after a server request is completed.
  */

  type ConcreteServerResponse${actionsNameSingular}<
    A extends ${actionsName}
  > = {
    type: string
    response: ServerResponseWith<${toPrefixedTypeVariant("ResponseData")}<A>>
  }
  
  export interface BaseSuccessServerResponse${actionsNameSingular}<
    A extends ${actionsName} ${allowsMetadata ? `, ${MetadataTypeName}` : ``}
  >
    extends ConcreteServerResponse${actionsNameSingular}<A> ${allowsMetadata ? `, ResponseMetadata<${MetadataTypeName}>` : ''}
      {}
  
  export interface BaseErrorServerResponse${actionsNameSingular}${allowsMetadata ? `<${MetadataTypeName}>` : ''}
    extends Action ${allowsMetadata ? `, ResponseMetadata<${MetadataTypeName}>` : ''} {
    type: string
    error: Response | Error
  }

  export type ServerResponse${actionsNameSingular}<A extends ${actionsName}${allowsMetadata ? `, ${MetadataTypeName}>` : 'A>' } =
    | BaseSuccessServerResponse${actionsNameSingular}${allowsMetadata ? `<A, ${MetadataTypeName}>` : '<A>' }
    | BaseErrorServerResponse${actionsNameSingular}${allowsMetadata ? `<${MetadataTypeName}>` : '' }


  /*
    Action Creators Generation for specific actionModifiers
  */
  ${withDerivedActionCreators.reduce((acc, { mapperTypeImportName, generateForVariants, extraParameters }) => `${acc}
    ${generateForVariants.reduce((var_acc, modifier) => `${var_acc}
      type ${toActionCreatorFunction(modifier)}Return = {
        [A in ${actionsName}]: (
          ${extraParameters ?
              extraParameters.reduce((acc, [parameter, parameterType]) => `${acc}
                ${parameter}: ${parameterType},
              `, "") :
              ""
          }
          ...args: Parameters<${mapperTypeImportName}<A>>
        ) => ReturnType<${mapperTypeImportName}<A>>
      }
      
      function ${toActionCreatorFunction(modifier)}(
        mapKeys: {
          [A in ${actionsName}]: ${toPrefixedTypeVariant(modifier)}<A>
        }
      ): (actionCreator: { [A in ${actionsName}]: ${mapperTypeImportName}<A> }) => ${toActionCreatorFunction(modifier)}Return {
        return function(actionCreator: { [A in ${actionsName}]: ${mapperTypeImportName}<A> }): ${toActionCreatorFunction(modifier)}Return {
          const wrappedActionCreator = {} as any
          for (const [key, creatorFn] of Object.entries(actionCreator)) {
            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            wrappedActionCreator[key] = function(${extraParameters ? extraParameters.reduce((acc, [parameter, parameterType]) => `${acc} ${parameter}: ${parameterType}, `, "") : "" } ...args: any[]) {
              return {
                ${extraParameters ?
                    extraParameters.reduce((acc, [parameter]) => `${acc}
                      ${parameter},
                    `, "") :
                    ""
                }
                type: mapKeys[key as Actions],
                payload: (creatorFn as any)(...args),
              }
            }
          }
          return wrappedActionCreator as ${toActionCreatorFunction(modifier)}Return
        }
      }
      export const ${toActionCreatorObjectGeneratorFunction(modifier)} = ${toActionCreatorFunction(modifier)}(${toConcreteMapperObject(modifier)})
    `, "")}
  `, "")}
  `
}
