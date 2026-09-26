import { test } from "node:test";
import assert from "node:assert/strict";
import { isTransitionAllowed } from "../src/utils/bookingStateMachine.js";

test("allowed transitions", () => {
  assert.equal(isTransitionAllowed("PENDING", "CONFIRMED"), true);
  assert.equal(isTransitionAllowed("PENDING", "CANCELLED"), true);
  assert.equal(isTransitionAllowed("CONFIRMED", "CANCELLED"), true);
});

test("disallowed transitions", () => {
  assert.equal(isTransitionAllowed("CANCELLED", "CONFIRMED"), false);
  assert.equal(isTransitionAllowed("CANCELLED", "CANCELLED"), false);
  assert.equal(isTransitionAllowed("CONFIRMED", "PENDING"), false);
});
