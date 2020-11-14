export type LeafType = "boolean" | "string" | "number" | "bigint" | "null";

export type SchemaType = LeafType | "object" | "array";

// a `leaf` type is a leaf in the tree (no children)
// a `nonContraintTypes` is a type that we do not allow contraints on
// a string is *not* a nonContraintTypes as we allow the `enum` contraint.
const leafTypes = new Set<SchemaType>([
  "boolean",
  "number",
  "bigint",
  "null",
  "string",
]);

const leafType = (s: Schema) => (s.type && leafTypes.has(s.type)) || false;
const nodeType = (s: Schema) => !s.type || !leafTypes.has(s.type);

const stringType = (s: Schema) => s.type === "string";

export const deduplicateAnyOf = ({ anyOf }: AnyOfSchema): AnyOfSchema => {
  console.log("called deduplicateAnyOf with", anyOf);
  if (anyOf.length === 0) {
    return { anyOf };
  }

  const leaves = anyOf.filter(leafType);

  // uniques is the collection that we will return...
  // initially it only contains leaves without the strings
  const uniques = Array.from(
    new Set(leaves.filter((x) => !stringType(x)).map((x) => JSON.stringify(x)))
  ).map((x) => JSON.parse(x) as Schema);

  // next we merge and add any string schemas
  // this will merge / remove the `enum` property
  const stringLeaves = leaves.filter(stringType) as StringSchema[];
  if (stringLeaves.length) {
    uniques.push(stringLeaves.reduce(unifyStringSchemas));
  }

  const nodes = anyOf.filter(nodeType);
  const arrays = nodes.filter((x) => x.type === "array") as ArraySchema[];
  // if any array does not have an `anyOf` then we throw an error
  // as this function should be called in a post walk fashion - all children
  // should have been converted already

  const arrayAnyOfs: Schema[] = [];
  arrays.forEach((x) => {
    if (x.items.constructor === Array) {
      throw new Error("tuples should have been converted to arrays!");
    }
    (x.items as AnyOfSchema).anyOf.forEach((s) => {
      arrayAnyOfs.push(s);
    });
  });

  if (arrays.length > 0) {
    // doesnt look great - if we have already performed a postwalk as we are recusrive again!
    const newArrayType = deduplicateAnyOf({ anyOf: arrayAnyOfs });
    uniques.push({ type: "array", items: newArrayType });
  }

  const objetcs = nodes.filter((x) => x.type === "object") as ObjectSchema[];
  // oof! - this is going to get spicey
  objetcs.forEach((x) => uniques.push(x));

  const nestedAnyOfs = nodes.filter(
    (x) => x.type === undefined && x.anyOf
  ) as AnyOfSchema[];
  // this is an error - they should not be here
  if (nestedAnyOfs.length) {
    throw new Error("should not have nested anyOfs");
  }

  // merge any string schemas
  return { anyOf: uniques };
};

interface BaseSchema {
  type?: SchemaType;
}

export interface AnyOfSchema extends BaseSchema {
  anyOf: Schema[];
}

export const anyOfSchema = (schemas: Schema[]): AnyOfSchema => {
  return { anyOf: schemas };
};

export interface NullSchema extends BaseSchema {
  type: "null";
}

export const nullSchema: NullSchema = { type: "null" };

export interface BooleanSchema extends BaseSchema {
  type: "boolean";
}

export const booleanSchema: BooleanSchema = { type: "boolean" };

export interface NumberSchema extends BaseSchema {
  type: "number";
}

export const numberSchema: NumberSchema = { type: "number" };

export interface BigIntSchema extends BaseSchema {
  type: "bigint";
}

export const bigintSchema: BigIntSchema = { type: "bigint" };

export interface StringSchema extends BaseSchema {
  type: "string";
  enum?: string[];
}

export const asStringSchema = (value: string): StringSchema => {
  return { type: "string", enum: [value] };
};

export const unifyStringSchemas = (
  schemaA: StringSchema,
  schemaB: StringSchema
): StringSchema => {
  // only keep enums if both strings have enums
  // if not then can only return a string type.
  // if we do not do this this then we will no longer validate expected data!
  const enums =
    schemaA.enum && schemaB.enum
      ? Array.from(new Set(schemaA.enum.concat(schemaB.enum)))
      : undefined;
  return enums ? { type: "string", enum: enums } : { type: "string" };
};

export interface ObjectSchema extends BaseSchema {
  type: "object";
  properties: { [key: string]: Schema };
  required: string[];
}

export interface ArraySchema extends BaseSchema {
  type: "array";
  items: Schema | Schema[];
}

export type Schema =
  | AnyOfSchema
  | NullSchema
  | BooleanSchema
  | NumberSchema
  | BigIntSchema
  | StringSchema
  | ArraySchema
  | ObjectSchema;

export interface TopLevelScehma extends ObjectSchema {
  title?: string;
  $id?: string;
  definitions?: { [key: string]: Schema };
}

export const resolveType = (data: any): SchemaType => {
  switch (typeof data) {
    case "number":
      return "number";
    case "bigint":
      return "bigint";
    case "string":
      return "string";
    case "boolean":
      return "boolean";
    case "object": {
      if (data == null) {
        return "null";
      }
      if (data.constructor === Array) {
        return "array";
      }
      if (data.constructor === Object) {
        return "object";
      }
    }
  }
  throw new Error(`${typeof data} is not a valid JSON schema type`);
};

export const describe = (data: any): Schema => {
  switch (resolveType(data)) {
    case "null": {
      return nullSchema;
    }
    case "number": {
      return numberSchema;
    }
    case "bigint": {
      return bigintSchema;
    }
    case "boolean": {
      return booleanSchema;
    }
    case "string": {
      return asStringSchema(data as string);
    }
    case "object": {
      return describeObject(data as object);
    }
    case "array": {
      return describeArray(data as any[]);
    }
    default: {
      throw new Error("Can not describe schema");
    }
  }
};

const describeObject = (o: object): ObjectSchema => {
  return {
    type: "object",
    required: Object.entries(o)
      .filter(([_, v]) => v !== undefined)
      .map(([k, _]) => k),
    properties: Object.entries(o).reduce((acc, [k, v]) => {
      if (v !== undefined) {
        acc[k] = describe(v);
      }
      return acc;
    }, {} as { [key: string]: Schema }),
  };
};

const describeArray = (a: any[]): ArraySchema => {
  return {
    type: "array",
    items: a.map((item) => describe(item)),
  };
};

export const postWalk = (schema: Schema, f: (s: Schema) => Schema): Schema => {
  // TODO - perform assertion that schema is actually valid
  switch (schema.type) {
    case "array": {
      const castSchema = schema as ArraySchema;
      return f({
        ...castSchema,
        items:
          castSchema.items.constructor === Array
            ? (castSchema.items as Schema[]).map((x) => postWalk(x, f))
            : postWalk(castSchema.items as Schema, f),
      });
    }
    case "object": {
      const castSchema = schema as ObjectSchema;
      return f({
        ...castSchema,
        properties: Object.entries(castSchema.properties).reduce(
          (acc, [k, v]) => {
            acc[k] = postWalk(v, f);
            return acc;
          },
          {} as { [key: string]: Schema }
        ),
      });
    }
    case undefined: {
      return f({
        ...schema,
        anyOf: schema.anyOf.map((x) => postWalk(x, f)),
      });
    }
    default: {
      return f(schema);
    }
  }
};
