import { test } from "node:test";
import assert from "node:assert/strict";
import { hashWebhookToken, parseSystemeSale, validWebhookToken } from "./course-access";

const sale = {
  type: "customer.sale.completed",
  created_at: "2026-11-13T12:00:00Z",
  data: {
    customer: { email: "  Buyer@Example.com " },
    order: { id: 100 },
    order_item: { id: 101, resources: [{ type: "membership_course", data: { id: 42 } }] },
    offer_price_plan: { id: 99 },
  },
};

test("only the intended sale grants access and normalizes email", () => {
  const result = parseSystemeSale(sale, { courseId: "42", offerPricePlanId: "" });
  assert.equal(result.outcome, "accepted");
  if (result.outcome === "accepted") {
    assert.equal(result.email, "buyer@example.com");
    assert.match(result.eventKey, /^[a-f0-9]{64}$/);
  }
  assert.deepEqual(result, parseSystemeSale(sale, { courseId: "42", offerPricePlanId: "" }));
});

test("an unconfigured course fails closed", () => {
  assert.equal(parseSystemeSale(sale, { courseId: "", offerPricePlanId: "" }).outcome, "not_configured");
});

test("both course and offer must match when configured", () => {
  assert.equal(parseSystemeSale(sale, { courseId: "42", offerPricePlanId: "99" }).outcome, "accepted");
  assert.equal(parseSystemeSale(sale, { courseId: "43", offerPricePlanId: "99" }).outcome, "ignored_course");
  assert.equal(parseSystemeSale(sale, { courseId: "42", offerPricePlanId: "98" }).outcome, "ignored_course");
  assert.equal(parseSystemeSale(sale, { courseId: "", offerPricePlanId: "99" }).outcome, "accepted");
});

test("opt-ins and malformed sales cannot grant access", () => {
  const config = { courseId: "42", offerPricePlanId: "" };
  assert.equal(parseSystemeSale({ ...sale, type: "contact.created" }, config).outcome, "ignored_event");
  assert.equal(parseSystemeSale({ ...sale, data: { ...sale.data, customer: { email: "invalid" } } }, config).outcome, "invalid_sale");
  assert.equal(parseSystemeSale({ ...sale, data: { ...sale.data, order: {} } }, config).outcome, "invalid_sale");
});

test("webhook tokens require the exact long secret", () => {
  const token = "a".repeat(64);
  const hash = hashWebhookToken(token);
  assert.equal(validWebhookToken(token, hash), true);
  for (const invalid of [undefined, ["a"], "", "a".repeat(39), "b".repeat(64), "a".repeat(201)]) {
    assert.equal(validWebhookToken(invalid, hash), false);
  }
  assert.equal(validWebhookToken(token, null), false);
});
