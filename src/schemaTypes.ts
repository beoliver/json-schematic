export type SchemaType =
  | "boolean"
  | "string"
  | "number"
  | "bigint"
  | "null"
  | "object"
  | "array";

interface BaseSchema {
  type?: SchemaType;
}

export interface AnyOfSchema extends BaseSchema {
  anyOf: Schema[];
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

export interface BigIntSchema extends BaseSchema {
  type: "bigint";
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
