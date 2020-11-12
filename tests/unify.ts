import { test } from "uvu";
import * as assert from "uvu/assert";
import { describeObject, unifySchemas } from "../src/index";

test("Test 4", () => {
  const a = { foo: [{ name: "a" }, { name: "b" }] };
  const b = { foo: [{ name: "c" }] };
  const c = {
    properties: {
      foo: {
        items: {
          properties: {
            name: {
              enum: ["a", "b", "c"],
              type: "string",
            },
          },
          required: ["name"],
          type: "object",
        },
        type: "array",
      },
    },
    required: ["foo"],
    type: "object",
  };
  assert.equal(unifySchemas([a, b].map(describeObject)), c);
});

test("Mary and Bob", () => {
  const data = [
    { name: "Mary", known: true },
    { name: "Bob", known: true },
  ];
  const schema = {
    properties: {
      name: {
        enum: ["Mary", "Bob"],
        type: "string",
      },
      known: {
        type: "boolean",
      },
    },
    required: ["name", "known"],
    type: "object",
  };
  assert.equal(unifySchemas(data.map(describeObject)), schema);
});

test("Nullable", () => {
  const data = [
    { name: "Mary", known: null },
    { name: "Bob", known: true },
  ];
  const schema = {
    properties: {
      name: {
        enum: ["Mary", "Bob"],
        type: "string",
      },
      known: {
        anyOf: [{ type: "null" }, { type: "boolean" }],
      },
    },
    required: ["name", "known"],
    type: "object",
  };
  assert.equal(unifySchemas(data.map(describeObject)), schema);
  assert.throws(() =>
    unifySchemas(data.map(describeObject), { nullable: false, unions: false })
  );
});

test("Unions", () => {
  const data = [
    { name: "Mary", known: 100 },
    { name: "Bob", known: true },
  ];
  const schema = {
    properties: {
      name: {
        enum: ["Mary", "Bob"],
        type: "string",
      },
      known: {
        anyOf: [{ type: "number" }, { type: "boolean" }],
      },
    },
    required: ["name", "known"],
    type: "object",
  };
  assert.equal(unifySchemas(data.map(describeObject)), schema);
  assert.throws(() =>
    unifySchemas(data.map(describeObject), { unions: false })
  );
});

test.run();
