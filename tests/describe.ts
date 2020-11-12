import { test } from "uvu";
import * as assert from "uvu/assert";
import { describe } from "../src/index";

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
  assert.equal(describe(data), schema);
});

test.run();
