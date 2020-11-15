import {
  AnyOfSchema,
  Schema,
  StringSchema,
  unifyStringSchemas,
} from "./schemas";

const _union = (a: Schema, b: Schema) => {
  if (a.type === b.type) {
    switch (a.type) {
      case "string": {
        return unifyStringSchemas(a as StringSchema, b as StringSchema);
      }
      case "array": {
        return { anyOf: [a, b] };
      }
      case "object": {
        return { anyOf: [a, b] };
      }
      case undefined: {
        return { anyOf: a.anyOf.concat((b as AnyOfSchema).anyOf) };
      }
      default: {
        return a;
      }
    }
  } else {
    return { anyOf: [a, b] };
  }
};

export const union = (schemas: Schema[]) => {
  schemas.reduce(_union);
};
