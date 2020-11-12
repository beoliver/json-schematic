import { ArraySchema, ObjectSchema, Schema, StringSchema } from "./schemaTypes";

export const unifySchemas = (schemas: Schema[]): Schema =>
  schemas.reduce(unify);

const unify = (schemaA: Schema, schemaB: Schema): Schema => {
  switch (schemaA.type === schemaB.type && schemaA.type) {
    case "object": {
      return unifyObjects(schemaA as ObjectSchema, schemaB as ObjectSchema);
    }
    case "array": {
      return unifyArrays(schemaA as ArraySchema, schemaB as ArraySchema);
    }
    case "string": {
      return unifyStrings(schemaA as StringSchema, schemaB as StringSchema);
    }
    case "boolean": {
      return schemaA;
    }
    case "number": {
      return schemaA;
    }
    case "null": {
      return schemaA;
    }
  }
  throw new Error(
    `Can not unify schemas of type '${schemaA.type}' and '${schemaB.type}'`
  );
};

export const unifyObjects = (
  schemaA: ObjectSchema,
  schemaB: ObjectSchema
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
      schemaB.properties[key]
    );
  });
  return schema;
};

const unifyArrays = (
  schemaA: ArraySchema,
  schemaB: ArraySchema
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
          unify(aSchema, (schemaB.items as Schema[])[index])
        ),
      };
    } else {
      // two lists of different lengths
      // both lists must reduce using unify then unify the results
      const xs = unifySchemas(schemaA.items);
      const ys = unifySchemas(schemaB.items);
      return { type: "array", items: unify(xs, ys) };
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
    return { type: "array", items: unify(xs as Schema, ys as Schema) };
  }
};

const unifyStrings = (
  schemaA: StringSchema,
  schemaB: StringSchema
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
