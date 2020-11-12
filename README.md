# json-schematic

opinionated tools for working with json schemas

## What does it do?

Lets you generate JSON-schemas from sample data.

## Why is it opinionated?

JSON schemas can describe more that Typescript. This can be a useful property - however my personal preference is to keep the **fidelty** of the schema as close to the compile time guarantees of Typescript - especially when working in a team.

One of the main benefits of autogenerating interfaces from schemas - is that you can get safety when type casting and a nicer developer (editor) experience.

# API

## `describeObject`

The `describeObject` function recursively traverses the input building up a json schema.

```ts
const describeObject: (obj: any) => Schema;
```

**Note:** Throws an error if `typeof obj` is not equal to `"object"` and `obj.constructor` is not equal to `Object`.

## `unifySchemas`

```ts
const unifySchemas: (schemas: Schema[], options?: UnificationOptions) => Schema;
```

Given a **non empty** array of schemas the `unifySchemas` function attempts to create a single schema `S` such that for every schema `s` in `schemas` and every possible input `x`

```latex
(validates(s_1,x) | ... | validates(s_n, x)) => validates(S,x)
```

This means that given some arbitrary input `x` - if there exists a schema `s` in the array of `schemas` such that `s` **validates** `x` - then the resulting schema `S` will also **validate** `x`. If there **DOES NOT** exist a schema `s` in the array of `schemas` such that `s` **validates** `x`, then `validates(S,x)` may still be **true**.

### **Important**

The following propoerty **DOES NOT** hold.

```latex
validates(S,x) => (validates(s_1,x) | ... | validates(s_n, x))
```
