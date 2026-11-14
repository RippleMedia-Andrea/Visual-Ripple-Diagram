import { createHash, timingSafeEqual } from "node:crypto";

export function isCourseOwner(userId: string): boolean {
  return Boolean(process.env.PURPOSE_LAB_OWNER_ID) &&
    userId === process.env.PURPOSE_LAB_OWNER_ID;
}

export function hashWebhookToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function validWebhookToken(token: unknown, expected: string | null): boolean {
  if (typeof token !== "string" || token.length < 40 || token.length > 200 || !expected) return false;
  const actual = Buffer.from(hashWebhookToken(token), "hex");
  const saved = Buffer.from(expected, "hex");
  return actual.length === saved.length && timingSafeEqual(actual, saved);
}

type SaleData = {
  customer?: { email?: unknown };
  order?: { id?: unknown };
  order_item?: { id?: unknown; resources?: Array<{ type?: unknown; data?: { id?: unknown } }> };
  offer_price_plan?: { id?: unknown };
};

export function parseSystemeSale(
  input: { type: string; created_at: string | Date; data: Record<string, unknown> },
  config: { courseId: string; offerPricePlanId: string },
) {
  if (!config.courseId && !config.offerPricePlanId) return { outcome: "not_configured" } as const;
  if (input.type !== "customer.sale.completed") return { outcome: "ignored_event" } as const;
  const data = input.data as SaleData;
  const email = typeof data.customer?.email === "string" ? data.customer.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { outcome: "invalid_sale" } as const;
  const courseMatches = !config.courseId || (
    Array.isArray(data.order_item?.resources) && data.order_item.resources.some((resource) =>
      resource?.type === "membership_course" && String(resource?.data?.id) === config.courseId)
  );
  const offerMatches = !config.offerPricePlanId || String(data.offer_price_plan?.id) === config.offerPricePlanId;
  if (!courseMatches || !offerMatches) return { outcome: "ignored_course" } as const;
  if (!data.order?.id || !data.order_item?.id) return { outcome: "invalid_sale" } as const;
  const eventKey = createHash("sha256").update(
    JSON.stringify([input.type, data.order.id, data.order_item.id, email]),
  ).digest("hex");
  return { outcome: "accepted", email, eventKey } as const;
}
