import { Router } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, journeyMessages, journeys, purposeThemes, storyCards } from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";

const router = Router();
const STAGES = ["reveal", "identify", "pinpoint", "personalize", "live", "expand"] as const;

async function getJourneyPayload(journeyId: number) {
  const [journey] = await db.select().from(journeys).where(eq(journeys.id, journeyId)).limit(1);
  const rows = await db
    .select()
    .from(journeyMessages)
    .where(eq(journeyMessages.journeyId, journeyId))
    .orderBy(asc(journeyMessages.createdAt), asc(journeyMessages.id));

  const messages = Object.fromEntries(STAGES.map((stage) => [stage, []])) as unknown as Record<
    (typeof STAGES)[number],
    Array<{ role: "user" | "assistant"; content: string }>
  >;

  for (const message of rows) {
    messages[message.stage].push({ role: message.role, content: message.content });
  }

  return { ...journey, messages };
}

router.use(requireAuth);

router.get("/current", async (_req, res, next) => {
  try {
    const userId = res.locals.user.id as string;
    let [journey] = await db
      .select()
      .from(journeys)
      .where(and(eq(journeys.userId, userId), eq(journeys.status, "in_progress")))
      .orderBy(desc(journeys.updatedAt))
      .limit(1);

    if (!journey) {
      [journey] = await db
        .select()
        .from(journeys)
        .where(eq(journeys.userId, userId))
        .orderBy(desc(journeys.updatedAt))
        .limit(1);
    }

    if (!journey) {
      [journey] = await db.insert(journeys).values({ userId }).returning();
    }

    const payload = await getJourneyPayload(journey.id);
    const [cards, themes] = await Promise.all([
      db.select().from(storyCards).where(eq(storyCards.journeyId, journey.id)).orderBy(asc(storyCards.position)),
      db.select().from(purposeThemes).where(eq(purposeThemes.journeyId, journey.id)).orderBy(asc(purposeThemes.position)),
    ]);
    res.json({ ...payload, storyCards: cards, themes });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = res.locals.user.id as string;
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid journey." });
      return;
    }

    const update: Partial<typeof journeys.$inferInsert> = {};
    if (Number.isInteger(req.body.currentStageIdx) && req.body.currentStageIdx >= 0 && req.body.currentStageIdx < 6) {
      update.currentStageIdx = req.body.currentStageIdx;
    }
    if (Array.isArray(req.body.selectedPrompts)) update.selectedPrompts = req.body.selectedPrompts;
    if (Array.isArray(req.body.purposeOptions)) update.purposeOptions = req.body.purposeOptions;
    if (typeof req.body.purposeStatement === "string" || req.body.purposeStatement === null) {
      update.purposeStatement = req.body.purposeStatement;
    }
    if (req.body.season === null || (req.body.season && typeof req.body.season === "object")) update.season = req.body.season;
    if (req.body.actionPlan === null || (req.body.actionPlan && typeof req.body.actionPlan === "object")) update.actionPlan = req.body.actionPlan;
    if (req.body.status === "in_progress" || req.body.status === "complete") {
      update.status = req.body.status;
      update.completedAt = req.body.status === "complete" ? new Date() : null;
    }
    update.updatedAt = new Date();

    const [journey] = await db.insert(journeys).values({ userId }).returning();

    if (!journey) {
      res.status(404).json({ error: "Journey not found." });
      return;
    }
    res.json(journey);
  } catch (error) {
    next(error);
  }
});


router.post("/:id/restart", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = res.locals.user.id as string;
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid journey." });
      return;
    }

    const [current] = await db
      .update(journeys)
      .set({ status: "complete", completedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(journeys.id, id), eq(journeys.userId, userId)))
      .returning();

    if (!current) {
      res.status(404).json({ error: "Journey not found." });
      return;
    }

    const [journey] = await db.insert(journeys).values({ userId }).returning();
    res.status(201).json(await getJourneyPayload(journey.id));
  } catch (error) {
    next(error);
  }
});

export default router;
