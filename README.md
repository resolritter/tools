# Run instructions

## Build

`npm install && npm run-script build`

This step will generate the files on the `dist` directory, which are, in turn,
used by the CLI tool entrypoint at `bin/res_ts`.

## Run

`bin/res_ts --help` to get usage instructions on the CLI front-end.

# Functionality walkthrough

## Code generation for Redux & Redux-Saga

### Motivation

[Redux](https://redux.js.org/) actions rely a lot on conditional types to be
fully discernible within the reducers' scope. We found the process of
bootstrapping a single Redux module to be repetitive and verbose, especially
when you rely on a middleware like [redux-saga](https://redux-saga.js.org/)
(which conventionally splits the course of an action in different states,
leading to a "explosion" of conditional types), as well as libraries which are
part of the middleware's ecosystem, such as
[redux-saga-requests](https://www.npmjs.com/package/redux-saga-requests) (which
adds even more outcomes on top of redux-saga's actions, thus aggravating the
issue).

## Label trees

### Motivation

Its main purpose is automatically generating unique identifiers for each
component in a nested component hierarchy. Generating it by hand is not only
verbose and error-prone, but the developer has to mentally keep track of how
deep he's in the tree in order to correctly manually produce the identifier
matching the node's **unique** identifier.

Aside from saving manual work, another benefit to this approach is that the data
is derived from a single source; thus, if the hierarchy changes, the mutations
are contained to the source definition file, making the outcome is predictable -
as opposed to manually doing search-and-replace in the editor, which might mess
up the ids.

### Use case

The generated tags are used to predictably ensure element reachability and eases
DOM selection of further children elements.

The generated identifiers are used in a manner that doesn't disrupt the
component's presentation, through the accessibility attributes:
[aria-label](https://www.w3.org/TR/WCAG20-TECHS/ARIA14.html) in the browsers or
[accessibility tags](https://www.polidea.com/blog/how-to-apply-ui-test-automation-in-react-native-apps/#view-elements-recognition)
on mobile.

### Practical example

Suppose you have the following schema definition:

```js
const formNodes = [
  ["Label", []],
  ["Input", []],
]

module.exports = {
  tree: [
    [
      "Login",
      [
        ["Email", formNodes],
        ["Password", formNodes],
        [
          "SignOut",
          [
            ["Default", []],
            ["Facebook", []],
          ],
        ],
      ],
    ],
  ],
```

For the leaf node called "Facebook", we don't have to manually spell out the
whole name (which would be "Login.Password.SignOut.Default.Facebook"). The name
depends on what's above it in the component tree and that's dynamic (i.e. if we
were to move that element somewhere else, it wouldn't be needed to keep track of
where it will land and do manual substitution, which is error-prone).

Since it's just JavaScript code, one can also reuse fragments of the tree, like
it's done with `formNodes` in that file. If no such thing was available, you'd
have to manually repeat the same code in both places, as well as ensure the
identifier would be nested correctly for each different occurrence.
