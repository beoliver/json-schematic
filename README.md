# json-schematic

opinionated tools for working with json schemas

## What does it do?

Lets you generate JSON-schemas from sample data.

## Why is it opinionated?

JSON schemas can describe more that Typescript. This can be a useful property - however my personal preference is to keep the **fidelty** of the schema as close to the compile time guarantees of Typescript - especially when working in a team.

One of the main benefits of autogenerating interfaces from schemas - is that you can get safety when type casting and a nicer developer (editor) experience.

# API

## `describe`

### Construct a schema from data.

```ts
const describe: (data: any) => Schema;
```

Returns a **strict** schema in the sense that the schema is most likely **over fitting** the data. The returned schema can be mapped onto a Typescript interface such that the compile time guarantees of typescript are equivalent to the the guarantees that the schema provides for validation.

In other words - If you construct an element using an interface generaterated from a schema and the code compiles using inference alone - then the schema is guaranteed to validate the data.
This means that certain json schema contraints are not available.

```
validates(data, Schema) <=> compiles(data : SchemaInterface)
```

```js
> const data = ["a", "b", "c"];
> describe(data)
{
    type  : "array",
    items : [
        {type : "string", enum : ["a"] },
        {type : "string", enum : ["b"] },
        {type : "string", enum : ["c"] }
    ]
}
```

## `weaken`

```ts
const weaken: (schema: Schema, options?: WeakenOptions) => Schema;
```

If the schema returned by `describe` is an **overfitting** of the data, the `weaken` function can be used to relax the schema. The default options mean that `weaken` serves as the identity function.

| Option                | default     | value  | enabled                                                                     | disabled |
| --------------------- | ----------- | ------ | --------------------------------------------------------------------------- | -------- |
| `noEnumeratedStrings` | `undefined` | `true` | Enumeration information is removed from strings.                            | No-op    |
| `tuplesAsArrays`      | `undefined` | `true` | Array length is ignored. Creates a union of possible types using `"anyOf"`. | No-op    |

```js
> const schema = {
    type  : "array",
    items : [
        {type : "string", enum : ["a"] },
        {type : "string", enum : ["b"] },
        {type : "string", enum : ["c"] }
    ]
};
> weaken(schema, { tuplesAsArrays : true })
{
    type  : "array",
    items : { type : "string", enum : ["a", "b", "c"] },
};
```

```js
> const schema = {
    type  : "array",
    items : [
        {type : "string", enum : ["a"] },
        {type : "number" },
    ]
};
> weaken(schema, { noEnumeratedStrings : true, tuplesAsArrays : true })
{
    type  : "array",
    items : { "anyOf" [ { type : "string" },  { type : "number" } ] } ,
};
```

See the next section for more information about how schemas are unified.
