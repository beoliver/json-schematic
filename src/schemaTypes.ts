export type SchemaType =
  | "boolean"
  | "string"
  | "number"
  | "null"
  | "object"
  | "array";

interface BaseSchema {
  type: SchemaType;
}

export interface NullSchema extends BaseSchema {
  type: "null";
}

export interface BooleanSchema extends BaseSchema {
  type: "boolean";
}

export interface NumberSchema extends BaseSchema {
  type: "number";
}

export interface ObjectSchema extends BaseSchema {
  type: "object";
  properties: { [key: string]: Schema };
  required: string[];
}

export interface ArraySchema extends BaseSchema {
  type: "array";
  items: Schema | Schema[];
}

export interface StringSchema extends BaseSchema {
  type: "string";
  format?: string;
  enum?: string[];
}

export type Schema =
  | NullSchema
  | BooleanSchema
  | NumberSchema
  | StringSchema
  | ArraySchema
  | ObjectSchema;

export const resolveType = (data: any): SchemaType => {
  switch (typeof data) {
    case "number":
      return "number";
    case "bigint":
      return "number";
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
