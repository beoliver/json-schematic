import {
  ArraySchema,
  BigIntSchema,
  BooleanSchema,
  NullSchema,
  NumberSchema,
  ObjectSchema,
  resolveType,
  StringSchema,
} from "./schemaTypes";

export const describeObject = (obj: any) => {
  const t = resolveType(obj);
  if (t !== "object") {
    throw new Error(`describeObject expects an object to be passed. Got: ${t}`);
  }
  return _describeObject(obj as object);
};

const describe = (data: any) => {
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
      return _describeString(data as string);
    }
    case "object": {
      return _describeObject(data as object);
    }
    case "array": {
      return _describeArray(data as any[]);
    }
  }
};

const booleanSchema: BooleanSchema = {
  type: "boolean",
};

const numberSchema: NumberSchema = {
  type: "number",
};

const bigintSchema: BigIntSchema = {
  type: "bigint",
};

const nullSchema: NullSchema = {
  type: "null",
};

const _describeObject = (o: object) => {
  const schema: ObjectSchema = {
    type: "object",
    properties: {},
    required: Object.keys(o),
  };
  Object.entries(o).forEach(([key, val]) => {
    schema.properties[key] = describe(val);
  });
  return schema;
};

const _describeArray = (a: any[]) => {
  const schema: ArraySchema = {
    type: "array",
    items: a.map((item) => describe(item)),
  };
  return schema;
};

const _describeString = (s: string) => {
  const schema: StringSchema = {
    type: "string",
    enum: [s],
  };
  return schema;
};
