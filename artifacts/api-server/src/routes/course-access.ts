import { Router } from "express";
import { randomBytes } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db, courseBuyers, courseWebhookEvents, courseWebhookSettings, user } from "@workspace/db";
import { GrantCourseAccessBody, UpdateCourseWebhookBody, ReceiveSystemeSaleBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/require-auth";
import { hashWebhookToken, isCourseOwner, parseSystemeSale, validWebhookToken } from "../lib/course-access";

const router = Router();
const noStore = (_req: unknown, res: { setHeader: (name: string, value: string) => unknown }, next: () => void) => {
  res.setHeader("Cache-Control", "no-store");
  next();
};
router.use(noStore);

router.get("/course-access", requireAuth, async (_req, res): Promise<void> => {
  const [account] = await db.select({ email: user.email }).from(user).where(eq(user.id, res.locals.user.id));
  const [buyer] = account ? await db.select().from(courseBuyers).where(eq(courseBuyers.email, account.email.trim().toLowerCase())) : [];
  // Current access remains available to everyone. Course status is server owned
  // and will be available to a future approved checkout without charging buyers.
  res.json({ fullAccess: true, courseBuyer: Boolean(buyer), isOwner: isCourseOwner(res.locals.user.id) });
});

router.use("/admin", requireAuth, (_req, res, next) => {
  if (!isCourseOwner(res.locals.user.id)) { res.status(403).json({ error: "Only the owner can manage course access." }); return; }
  next();
});

async function settings() {
  const [row] = await db.select().from(courseWebhookSettings).where(eq(courseWebhookSettings.id, 1));
  return row;
}

router.get("/admin/course-buyers", async (_req, res): Promise<void> => {
  const [buyers, events, config] = await Promise.all([
    db.select().from(courseBuyers).orderBy(desc(courseBuyers.grantedAt)),
    db.select().from(courseWebhookEvents).orderBy(desc(courseWebhookEvents.id)).limit(100),
    settings(),
  ]);
  res.json({ buyers, events, webhook: {
    courseId: config?.courseId ?? "", offerPricePlanId: config?.offerPricePlanId ?? "",
    configured: Boolean(config?.tokenHash && (config.courseId || config.offerPricePlanId)),
  } });
});

router.post("/admin/course-buyers", async (req, res): Promise<void> => {
  const parsed = GrantCourseAccessBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Enter a valid email address." }); return; }
  const email = parsed.data.email.trim().toLowerCase();
  const [buyer] = await db.insert(courseBuyers).values({ email, source: "manual" })
    .onConflictDoUpdate({ target: courseBuyers.email, set: { email } }).returning();
  res.json(buyer);
});

router.patch("/admin/course-webhook", async (req, res): Promise<void> => {
  const parsed = UpdateCourseWebhookBody.safeParse(req.body);
  if (!parsed.success || ![parsed.data.courseId, parsed.data.offerPricePlanId].every((s) => !s || /^\d+$/.test(s))) {
    res.status(400).json({ error: "Use the numeric Systeme.io course or offer price plan ID, or leave it blank." }); return;
  }
  const [config] = await db.insert(courseWebhookSettings)
    .values({ id: 1, ownerId: res.locals.user.id, ...parsed.data })
    .onConflictDoUpdate({ target: courseWebhookSettings.id, set: { ...parsed.data, updatedAt: new Date() } }).returning();
  res.json({ courseId: config.courseId, offerPricePlanId: config.offerPricePlanId,
    configured: Boolean(config.tokenHash && (config.courseId || config.offerPricePlanId)) });
});

router.post("/admin/course-webhook", async (_req, res): Promise<void> => {
  const origin = process.env.PUBLIC_APP_URL;
  if (!origin || !URL.canParse(origin) || new URL(origin).protocol !== "https:") {
    res.status(503).json({ error: "Set PUBLIC_APP_URL to the published HTTPS address before creating a webhook URL." }); return;
  }
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashWebhookToken(token);
  await db.insert(courseWebhookSettings).values({ id: 1, ownerId: res.locals.user.id, tokenHash })
    .onConflictDoUpdate({ target: courseWebhookSettings.id, set: { tokenHash, updatedAt: new Date() } });
  const url = new URL("/api/systeme-sale", origin);
  url.searchParams.set("token", token);
  res.json({ url: url.toString() });
});

router.post("/systeme-sale", async (req, res): Promise<void> => {
  const config = await settings();
  async function log(outcome: string, eventKey?: string) {
    await db.insert(courseWebhookEvents).values({ outcome, eventKey });
    req.log.info({ outcome, eventKey }, "Systeme webhook received");
  }
  if (!validWebhookToken(req.query.token, config?.tokenHash ?? null)) {
    await log("unauthorized");
    res.status(401).json({ error: "Invalid webhook token." }); return;
  }
  if (!config || (!config.courseId && !config.offerPricePlanId)) {
    await log("not_configured");
    res.status(503).json({ error: "Select a qualifying course or offer before sending sales." }); return;
  }
  const parsed = ReceiveSystemeSaleBody.safeParse(req.body);
  if (!parsed.success) { await log("invalid_payload"); res.status(400).json({ error: "Invalid sale event." }); return; }
  const result = parseSystemeSale(parsed.data, config);
  if (result.outcome === "invalid_sale") { await log(result.outcome); res.status(400).json({ error: "A sale needs customer email, order ID, and order item ID." }); return; }
  if (result.outcome !== "accepted") { await log(result.outcome); res.json({ received: true, outcome: result.outcome }); return; }
  await db.transaction(async (tx) => {
    const [buyer] = await tx.insert(courseBuyers).values({ email: result.email, source: "systeme" }).onConflictDoNothing().returning();
    await tx.insert(courseWebhookEvents).values({ eventKey: result.eventKey, outcome: buyer ? "granted" : "already_granted" });
  });
  req.log.info({ eventKey: result.eventKey, outcome: "recorded" }, "Systeme webhook received");
  res.json({ received: true });
});
export default router;
