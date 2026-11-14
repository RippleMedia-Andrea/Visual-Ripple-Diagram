import { test } from "node:test";
import assert from "node:assert/strict";
import { containsUnknown } from "./discovery-validation";

test("ordinary words about the unknown remain valid discoveries", () => {
  assert.equal(containsUnknown({ impact: ["Helping people step into the unknown", "Feeling less alone in unknown places"] }), false);
  assert.equal(containsUnknown("I was an unknown visitor who felt welcomed."), false);
});
test("actual nested placeholder values are rejected", () => {
  for (const value of ["<UNKNOWN>", "UNKNOWN", " unknown ", { stories: [{ summary: "<unknown>" }] }, ["The impact was <UNKNOWN>."]]) {
    assert.equal(containsUnknown(value), true);
  }
});
