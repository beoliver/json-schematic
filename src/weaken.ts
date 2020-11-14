import { ArraySchema, deduplicateAnyOf, postWalk, Schema } from "./schemas";

const noEnumeratedStrings = (schema: Schema): Schema =>
  postWalk(schema, (s: Schema) =>
    s.type === "string" ? { type: "string" } : s
  );

const tuplesAsArrays = (schema: Schema): Schema =>
  postWalk(schema, (s: Schema) => {
    switch (s.type) {
      case "array": {
        const castSchema = s as ArraySchema;
        // if array `items` is not a list then we can return it
        if (castSchema.items.constructor !== Array) {
          return castSchema;
        }
        // items is an array... we want to remove duplicates
        // but for simplicity right now we just perform the following
        return {
          type: "array",
          items: deduplicateAnyOf({ anyOf: castSchema.items }),
        };
      }
      case undefined: {
        // anyOf schema
        // we want to remove duplicates
        // but for simplicity right now we just perform the following
        return s;
      }
      default: {
        // f has been called on all sub schemas...
        return s;
      }
    }
  });

interface WeakenOptions {
  noEnumeratedStrings?: boolean;
  tuplesAsArrays?: boolean;
}

export const weaken = (schema: Schema, options: WeakenOptions = {}): Schema => {
  const schema1 = options.noEnumeratedStrings
    ? noEnumeratedStrings(schema)
    : schema;
  const schema2 = options.tuplesAsArrays ? tuplesAsArrays(schema1) : schema1;
  return schema2;
};
