import { test } from "uvu";
import * as assert from "uvu/assert";
import { describe } from "../src/index";

test("describe string", () => {
  assert.equal(describe("text"), { type: "string", enum: ["text"] });
});

test("describe bool", () => {
  assert.equal(describe(true), { type: "boolean" });
  assert.equal(describe(false), { type: "boolean" });
});

test("describe number", () => {
  assert.equal(describe(1), { type: "number" });
  assert.equal(describe(Math.PI), { type: "number" });
});

test("describe bigint", () => {
  assert.equal(describe(BigInt(9007199254740991)), { type: "bigint" });
});

test("describe null", () => {
  assert.equal(describe(null), { type: "null" });
});

test("describe object", () => {
  const data1 = { hello: "world" };
  const schema1 = {
    type: "object",
    properties: {
      hello: {
        enum: ["world"],
        type: "string",
      },
    },
    required: ["hello"],
  };
  assert.equal(describe(data1), schema1);
  const data2 = { hello: undefined };
  const schema2 = {
    type: "object",
    properties: {},
    required: [],
  };
  assert.equal(describe(data2), schema2);
});

test("describe array", () => {
  const data1 = [1];
  const schema1 = {
    items: [{ type: "number" }],
    type: "array",
  };
  assert.equal(describe(data1), schema1);
  const data2 = [1, 2];
  const schema2 = {
    items: [{ type: "number" }, { type: "number" }],
    type: "array",
  };
  assert.equal(describe(data2), schema2);
  const data3 = [1, true];
  const schema3 = {
    items: [{ type: "number" }, { type: "boolean" }],
    type: "array",
  };
  assert.equal(describe(data3), schema3);
});

test.run();
