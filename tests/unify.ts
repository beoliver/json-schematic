import { test } from "uvu";
import * as assert from "uvu/assert";
import { describe, unifySchemas } from "../src/index";

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
  assert.equal(unifySchemas([a, b].map(describe)), c);
});

test.run();
