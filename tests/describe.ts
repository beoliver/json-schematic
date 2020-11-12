import { test } from "uvu";
import * as assert from "uvu/assert";
import { describeObject } from "../src/index";

test("Test 1", () => {
  const data = { hello: "world" };
  const schema = {
    properties: {
      hello: {
        enum: ["world"],
        type: "string",
      },
    },
    required: ["hello"],
    type: "object",
  };
  assert.equal(describeObject(data), schema);
});

test("Mary", () => {
  const data = { name: "Mary", known: true };
  const schema = {
    properties: {
      name: {
        enum: ["Mary"],
        type: "string",
      },
      known: {
        type: "boolean",
      },
    },
    required: ["name", "known"],
    type: "object",
  };
  assert.equal(describeObject(data), schema);
});

test.run();
