import { test } from "uvu";
import * as assert from "uvu/assert";
import { describe, weaken } from "../src/index";

test("weaken string", () => {
  const x = "text";
  assert.equal(weaken(describe(x)), describe(x));
  assert.equal(weaken(describe(x), { tuplesAsArrays: true }), describe(x));
  assert.equal(weaken(describe(x), { noEnumeratedStrings: true }), {
    type: "string",
  });
  assert.equal(
    weaken(describe(x), { noEnumeratedStrings: true, tuplesAsArrays: true }),
    {
      type: "string",
    }
  );
});

test("weaken bool", () => {
  const x = true;
  assert.equal(weaken(describe(x)), describe(x));
  assert.equal(weaken(describe(x), { noEnumeratedStrings: true }), describe(x));
  assert.equal(weaken(describe(x), { tuplesAsArrays: true }), describe(x));
});

test("weaken number", () => {
  const x = 1;
  assert.equal(weaken(describe(x)), describe(x));
  assert.equal(weaken(describe(x), { noEnumeratedStrings: true }), describe(x));
  assert.equal(weaken(describe(x), { tuplesAsArrays: true }), describe(x));
});

test("weaken bigint", () => {
  const x = BigInt(9007199254740991);
  assert.equal(weaken(describe(x)), describe(x));
  assert.equal(weaken(describe(x), { noEnumeratedStrings: true }), describe(x));
  assert.equal(weaken(describe(x), { tuplesAsArrays: true }), describe(x));
});

test("weaken null", () => {
  const x = null;
  assert.equal(weaken(describe(x)), describe(x));
  assert.equal(weaken(describe(x), { noEnumeratedStrings: true }), describe(x));
  assert.equal(weaken(describe(x), { tuplesAsArrays: true }), describe(x));
});

test("weaken object", () => {
  const x = { hello: "world" };
  assert.equal(weaken(describe(x)), describe(x));
  const schema1 = {
    properties: {
      hello: { type: "string" },
    },
    required: ["hello"],
    type: "object",
  };
  assert.equal(weaken(describe(x), { noEnumeratedStrings: true }), schema1);
  assert.equal(weaken(describe(x), { tuplesAsArrays: true }), describe(x));

  const y = { hello: undefined };
  assert.equal(weaken(describe(y)), describe(y));
  assert.equal(weaken(describe(y), { noEnumeratedStrings: true }), describe(y));
  assert.equal(weaken(describe(x), { tuplesAsArrays: true }), describe(x));
});

test("weaken array test 1", () => {
  const x = [1, 2, "three", "four"];
  assert.equal(weaken(describe(x)), describe(x));
  const noEnumeratedStringsSchema = {
    items: [
      { type: "number" },
      { type: "number" },
      { type: "string" },
      { type: "string" },
    ],
    type: "array",
  };
  assert.equal(
    weaken(describe(x), { noEnumeratedStrings: true }),
    noEnumeratedStringsSchema
  );
  const tuplesAsArraysSchema = {
    items: {
      anyOf: [{ type: "number" }, { type: "string", enum: ["three", "four"] }],
    },
    type: "array",
  };
  assert.equal(
    weaken(describe(x), { tuplesAsArrays: true }),
    tuplesAsArraysSchema
  );
  const noEnumeratedStringsSchema_tuplesAsArraysSchema = {
    items: { anyOf: [{ type: "number" }, { type: "string" }] },
    type: "array",
  };
  assert.equal(
    weaken(describe(x), { noEnumeratedStrings: true, tuplesAsArrays: true }),
    noEnumeratedStringsSchema_tuplesAsArraysSchema
  );
});

test("weaken array test 2", () => {
  const data = [1, 2, "three", "four", 5];
  const d = describe(data);
  const w = weaken(d, { tuplesAsArrays: true });
  const schema = {
    type: "array",
    items: {
      anyOf: [{ type: "number" }, { type: "string", enum: ["three", "four"] }],
    },
  };
  assert.equal(w, schema);
});

test.run();
