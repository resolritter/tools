import { snakeCase } from "lodash"

export function toReduxActionName(identifier: string): string {
  return snakeCase(identifier).toUpperCase()
}

