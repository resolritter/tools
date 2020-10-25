import { set, merge } from "lodash"

export type Node = [string, Node[]]
export type OutputSchema = Record<string, object>
export type Configuration = {
  tree: Node[]
}

function buildComponentHierarchy(
  outputSchema: OutputSchema,
  currentPath: string,
  [currentNode, children]: Node,
): object {
  const nextPath = `${currentPath}.${currentNode}`
  set(outputSchema, nextPath, { id: nextPath })
  for (const child of children) {
    outputSchema = merge(
      outputSchema,
      buildComponentHierarchy(outputSchema, nextPath, child),
    )
  }
  return outputSchema
}

/*
 * Generates a JSON object matching a component hierarchy.
 * Each "root" is exported as a separate element because one hierarchy might
 * have multiple roots, although it's unusual.
 *
 * module.exports = {
 *   "Form": {
 *         "id": "Form",
 *         "Email": {
 *             "id": "Form.Email",
 *             "Label": {
 *                 "id": "Form.Email.Label"
 *             },
 *             "Input": {
 *                 "id": "Form.Email.Input"
 *             }
 *         },
 *         "Password": {
 *             "id": "Form.Password",
 *             "Label": {
 *                 "id": "Form.Password.Label"
 *             },
 *             "Input": {
 *                 "id": "Form.Password.Input"
 *             }
 *         }
 *    }
 *  }
 */
export function generate(conf: Configuration): string {
  let outputSchema: OutputSchema = {}
  // flatten one level upfront, so that the pages are on the object's root
  for (const [node, children] of conf.tree) {
    outputSchema[node] = { id: node }
    for (const child of children) {
      outputSchema = merge(
        outputSchema,
        buildComponentHierarchy(outputSchema, node, child),
      )
    }
  }

  const outputIndentation = 4
  return JSON.stringify(outputSchema, null, outputIndentation)
}
