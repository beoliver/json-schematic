# json-schematic

Opinionated tools for working with json schemas.

## Why is it opinionated?

JSON schemas can describe more that Typescript. This can be a useful property - however my personal preference is to keep the **fidelity** of the schema as close to the compile time guarantees of Typescript - especially when working in a team.

## What does it do?

Generates JSON-schemas from sample data. The generated schemas are **guaranteed** to preserve the following properties

1. Schemas are expressed using a subset of the JSON-schema specification that is isomorphic to Typescript.

2. Schemas are by default both **sound** and **complete**. This means that any schema produced is guaranteed to validate every "valid" example of sample data and invalidate every "invalid" example of sample data.

This means that Typescript files and Schema validators can be generated providing the same run-time guarantees as compile time. There is one further aim of the project:

- Provide the user with a means to **generalise** schemas without sacrificing soundness or completeness.

This concerns practicality. As the process is automated and **safe** - the resulting schemas may overfit the the sample data. It is often the case that we just cant get enough sample data to desribe the "whole picture". Generalisation can be user controlled or perfomed automatically.

## How do I use it?

1. Provide examples if **valid** and **invalid** data.
2. Two initial schemas are then generated. One that descibes the **valid** data and one that descibes the **invalid** data. If there are inconsitencies - for example a schema can not be created that validates all valid examples while also invalidating all invalid examples then an error will be thrown. Either you made a mistake - or you are trying to express a contraint that can not be expressed with the Typescript system.
3. Generalise the validation schema.

# API

## `describe`

```ts
const describe: (data: any) => Schema;
```

Returns a schema that fits the data as accurately as possible.

## `union`

```ts
const union: (schemas: Schema[]) => Schema;
```

Returns a schema representing the union of 1 or more arbitrary number of Schemas. Attemps to build the smallest schema possible that only validates data described by the schemas provided. If `schemas` is an empty list an error is thrown.

## `weakenAt`

```ts
const weakenAt: (
  schema: Schema,
  path: (string | number | symbol)[],
  options?: WeakenOptions
) => Schema;
```

The `weakenAt` function can be used to relax the schema.

| Option                | type      | default | enabled                                                                     | disabled |
| --------------------- | --------- | ------- | --------------------------------------------------------------------------- | -------- |
| `noEnumeratedStrings` | `boolean` | `false` | Enumeration information is removed from strings.                            | No-op    |
| `tuplesAsArrays`      | `boolean` | `false` | Array length is ignored. Creates a union of possible types using `"anyOf"`. | No-op    |
| `includeChildren`     | `boolean` | `false` | Recusively perfrom weakening action on all children                         | -        |

### noEnumeratedStringsAt

```ts
const noEnumeratedStringsAt: (
  schema: Schema,
  path: (string | number | symbol)[]
) => Schema;
```

Shorhand for `weakenAt(schema, path, { noEnumeratedStrings : true })`

### noEnumeratedStringsFrom

```ts
const noEnumeratedStringsAt: (
  schema: Schema,
  path: (string | number | symbol)[]
) => Schema;
```

Shorhand for `weakenAt(schema, path, { noEnumeratedStrings : true, includeChildren : true })`

### tuplesAsArraysAt

```ts
const tuplesAsArraysAt: (
  schema: Schema,
  path: (string | number | symbol)[]
) => Schema;
```

Shorhand for `weakenAt(schema, path, { tuplesAsArrays : true })`

### tuplesAsArraysFrom

```ts
const tuplesAsArraysAt: (
  schema: Schema,
  path: (string | number | symbol)[]
) => Schema;
```

Shorhand for `weakenAt(schema, path, { tuplesAsArrays : true, includeChildren : true })`

## `generate`

```ts
const generate: (schema: Schema, n: number, options?: GenerateOptions) => any[];
```

Generate `n` elements that `schema` will validate. By default produces data elements such that for each element `x` : `describe(x) === schema`. Options allow for finer grained control over properties (for example generating data that `schema` validates but containing keys that are non required). Note that **uniqueness** of data generated is not guaranteed.

## `generator`

```ts
const generator: (schema: Schema, options?: GenerateOptions) => () => any;
```

Retuns a function that when called returns an element that `schema` will validate. By default produces data elements such that for each element `x` : `describe(x) === schema`. Options allow for finer grained control over properties (for example generating data that `schema` validates but containing keys that are non required). Note that **uniqueness** of data generated is not guaranteed.

# Examples

## `describe`

```js
> const data = { foo : ["a", "b", "c"] };
> describe(data)
{   type : "object",
    required : ["foo"],
    properties : {
      foo : {
        type  : "array",
        items : [
          {type : "string", enum : ["a"] },
          {type : "string", enum : ["b"] },
          {type : "string", enum : ["c"] }
        ]
      }
    }
}
```

Where the equivaelnt interface would be

```ts
interface Example {
  foo: ["a", "b", "c"];
}
```

## `validationSubset`

```ts
const validationSubset: (schemaA : Schema, schemaB : Schema) : boolean
```

Returns `true` if every input that `schemaA` validates is also validated by `schemaB`. `schemaB` may validate **more** than `schemaA`. Another way of looking at it is that when true - we know that `schemaA` is **stricter** (or at least as strict) as `schemaB`.

This can be descibed as "if for all possible inputs `x`" the following holds:

```
valid(schemaA, x) => valid(schemaB,x)
```

In terms of typescript an example would be

```ts
interface A {
  // exact match of data
  foo: ["a", "b"];
}
interface B {
  // preserve length but not values
  foo: [string, string];
}
interface C {
  // preserve values but not length
  foo: ("a" | "b")[];
}
interface D {
  // preserve neither values nor length
  foo: string[];
}
```

Where `A` is a subset of `B`,`C` and `D`. `B` and `C` are subsets of `D`. In terms of a Hasse diagram:

```
    D
  /   \
B       C
  \   /
    A
```

## `validationEquivalent`

```ts
const validationEquivalent: (schemaA : Schema, schemaB : Schema) : boolean
```

Returns `true` if `schemaA` and `schemaB` validate exactly the same inputs.

## `invalidationSubset`

```ts
const invalidationSubset: (schemaA : Schema, schemaB : Schema) : boolean
```

Returns `true` if every input that `schemaA` **invalidates** is also **invalidated** by `schemaB`. `schemaB` may invalidate **more** than `schemaA`.

This can be descibed as "if for all possible inputs `x`" the following holds:

```
invalid(schemaA, x) => invalid(schemaB,x)
```

## `invalidationEquivalent`

```ts
const invalidationEquivalent: (schemaA : Schema, schemaB : Schema) : boolean
```

Returns `true` if `schemaA` and `schemaB` invalidate exactly the same inputs.

## `equivalent`

Two schemas are equivalent if they both validate and invalidate the same inputs.

```ts
const equivalent: (schemaA : Schema, schemaB : Schema) : boolean
```

This function is shorthant for the following

```
validationSubset(schemaA, schemaB) && validationSubset(schemaB, schemaA)
```

## `weaken`

```js
> const data = [1, 2, "three", "four", 5];
> weaken(describe(data), { tuplesAsArrays: true });
{
    type: "array",
    items: {
      anyOf: [{ type: "number" }, { type: "string", enum: ["three", "four"] }],
    },
};
> weaken(describe(data), { tuplesAsArrays: true, noEnumeratedStrings : true });
{
    type: "array",
    items: {
      anyOf: [{ type: "number" }, { type: "string" }],
    },
};
```
