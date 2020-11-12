import {
  ArraySchema,
  BooleanSchema,
  NullSchema,
  NumberSchema,
  ObjectSchema,
  resolveType,
  StringSchema,
} from "./schemaTypes";

export const describe = (data: any) => {
  switch (resolveType(data)) {
    case "null": {
      return nullSchema;
    }
    case "number": {
      return numberSchema;
    }
    case "boolean": {
      return booleanSchema;
    }
    case "string": {
      return describeString(data as string);
    }
    case "object": {
      return describeObject(data as object);
    }
    case "array": {
      return describeArray(data as any[]);
    }
  }
};

const booleanSchema: BooleanSchema = {
  type: "boolean",
};

const numberSchema: NumberSchema = {
  type: "number",
};

const nullSchema: NullSchema = {
  type: "null",
};

const describeObject = (o: object) => {
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

const describeArray = (a: any[]) => {
  const schema: ArraySchema = {
    type: "array",
    items: a.map((item) => describe(item)),
  };
  return schema;
};

const describeString = (s: string) => {
  const schema: StringSchema = {
    type: "string",
    enum: [s],
  };
  return schema;
};
