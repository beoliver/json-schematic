import {
  AnyOfSchema,
  ArraySchema,
  ObjectSchema,
  Schema,
  StringSchema,
} from "./schemaTypes";

interface UnificationOptions {
  enums?: boolean;
  tuples?: boolean;
  unions?: boolean;
  nullable?: boolean;
}

const defaultOptions: UnificationOptions = {
  enums: true,
  tuples: true,
  unions: true,
  nullable: true,
};

export const unifySchemas = (
  schemas: Schema[],
  options = defaultOptions
): Schema => schemas.reduce((a, b) => unify(a, b, options));

const unify = (
  schemaA: Schema,
  schemaB: Schema,
  options: UnificationOptions
): Schema => {
  switch (schemaA.type === schemaB.type && schemaA.type) {
    case undefined: {
      // both schemas are of the form { anyOf : [...] }
      return unifyAnyOf(
        schemaA as AnyOfSchema,
        schemaB as AnyOfSchema,
        options
      );
    }
    case "object": {
      return unifyObjects(
        schemaA as ObjectSchema,
        schemaB as ObjectSchema,
        options
      );
    }
    case "array": {
      return unifyArrays(
        schemaA as ArraySchema,
        schemaB as ArraySchema,
        options
      );
    }
    case "string": {
      return unifyStrings(
        schemaA as StringSchema,
        schemaB as StringSchema,
        options
      );
    }
    case "boolean": {
      return schemaA;
    }
    case "number": {
      return schemaA;
    }
    case "bigint": {
      return schemaA;
    }
    case "null": {
      return schemaA;
    }
  }
  if (schemaA.type && schemaB.type && options.unions) {
    return { anyOf: [schemaA, schemaB] };
  }
  if (
    (schemaA.type === "null" || schemaB.type === "null") &&
    options.nullable
  ) {
    return { anyOf: [schemaA, schemaB] };
  }

  // need to check if schemaB is a member of schemaA.anyOf
  if (schemaA.type === undefined) {
    return { anyOf: [...schemaA.anyOf, schemaB] };
  }
  // need to check if schemaA is a member of schemaB.anyOf
  if (schemaB.type === undefined) {
    return { anyOf: [...schemaB.anyOf, schemaA] };
  }
  throw new Error(
    `Can not unify schemas of type '${schemaA.type}' and '${schemaB.type}'`
  );
};

export const unifyObjects = (
  schemaA: ObjectSchema,
  schemaB: ObjectSchema,
  options: UnificationOptions
): ObjectSchema => {
  const schema: ObjectSchema = {
    type: "object",
    required: schemaA.required.filter((x) => schemaB.required.includes(x)),
    properties: {},
  };
  // no need to unify disjoint keys
  const uniqueA = Object.entries(schemaA.properties).filter(
    ([key, _]) => !schemaB.required.includes(key)
  );
  const uniqueB = Object.entries(schemaB.properties).filter(
    ([key, _]) => !schemaA.required.includes(key)
  );
  uniqueA.concat(uniqueB).forEach(([key, subSchema]) => {
    schema.properties[key] = subSchema;
  });
  // unify the `required` keys shared by both objects
  schema.required.forEach((key) => {
    schema.properties[key] = unify(
      schemaA.properties[key],
      schemaB.properties[key],
      options
    );
  });
  return schema;
};

const unifyAnyOf = (
  schemaA: AnyOfSchema,
  schemaB: AnyOfSchema,
  options: UnificationOptions
): AnyOfSchema => {
  if (
    options.nullable &&
    schemaA.anyOf.length === 2 &&
    schemaA.anyOf.find((x) => x.type === "null") &&
    schemaB.anyOf.length === 2 &&
    schemaB.anyOf.find((x) => x.type === "null")
  ) {
    const xs = schemaA.anyOf.concat(
      schemaB.anyOf.filter((x) => x.type !== "null")
    );
    return { anyOf: xs };
  }
  if (options.unions) {
    return { anyOf: schemaA.anyOf.concat(schemaB.anyOf) };
  }
  throw new Error("Can not perform union due to options passed");
};

const unifyArrays = (
  schemaA: ArraySchema,
  schemaB: ArraySchema,
  options: UnificationOptions
): ArraySchema => {
  if (
    schemaA.items.constructor === schemaB.items.constructor &&
    schemaA.items.constructor === Array &&
    schemaB.items.constructor === Array // for typescript
  ) {
    if (schemaA.items.length === schemaB.items.length) {
      return {
        type: "array",
        items: schemaA.items.map((aSchema, index) =>
          unify(aSchema, (schemaB.items as Schema[])[index], options)
        ),
      };
    } else {
      // two lists of different lengths
      // both lists must reduce using unify then unify the results
      const xs = unifySchemas(schemaA.items);
      const ys = unifySchemas(schemaB.items);
      return { type: "array", items: unify(xs, ys, options) };
    }
  } else {
    // one of the lists is not an array
    const xs =
      schemaA.items.constructor === Array
        ? unifySchemas(schemaA.items)
        : schemaA.items;
    const ys =
      schemaB.items.constructor === Array
        ? unifySchemas(schemaB.items)
        : schemaB.items;
    return { type: "array", items: unify(xs as Schema, ys as Schema, options) };
  }
};

const unifyStrings = (
  schemaA: StringSchema,
  schemaB: StringSchema,
  options: UnificationOptions
): StringSchema => {
  if (schemaA.enum && schemaB.enum) {
    const e = Array.from(new Set(schemaA.enum.concat(schemaB.enum)));
    if (schemaA.format && schemaA.format === schemaB.format) {
      return { type: "string", enum: e, format: schemaA.format };
    } else {
      // should union format?
      return { type: "string", enum: e };
    }
  } else {
    // one or more are not described by enums
    if (schemaA.format && schemaA.format === schemaB.format) {
      return { type: "string", format: schemaA.format };
    } else {
      // should union format?
      return { type: "string" };
    }
  }
};
