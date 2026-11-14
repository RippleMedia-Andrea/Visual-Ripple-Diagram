import { Router } from "express";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, discoveryRevisions, journeyMessages, journeys, purposeThemes, storyCards } from "@workspace/db";
import { UpdateJourneyBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/require-auth";

const router = Router();
// Keep the legacy season transcript separate from the new Picture exercise.
const STAGES = ["reveal", "identify", "pinpoint", "personalize", "picture", "live", "expand"] as const;

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
    const practice = _req.query.practice === "true";
    let [journey] = await db
      .select()
      .from(journeys)
      .where(and(eq(journeys.userId, userId), eq(journeys.isPractice, practice), eq(journeys.status, "in_progress")))
      .orderBy(desc(journeys.updatedAt))
      .limit(1);

    if (!journey) {
      [journey] = await db
        .select()
        .from(journeys)
        .where(and(eq(journeys.userId, userId), eq(journeys.isPractice, practice)))
        .orderBy(desc(journeys.updatedAt))
        .limit(1);
    }

    if (!journey) {
      [journey] = await db.insert(journeys).values({ userId, isPractice: practice }).returning();
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
    const parsed = UpdateJourneyBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Please check your discovery fields and try again." }); return; }
    const [existing] = await db.select().from(journeys).where(and(eq(journeys.id, id), eq(journeys.userId, userId)));
    if (!existing) { res.status(404).json({ error: "Journey not found." }); return; }
    const nextStage = parsed.data.currentStageIdx;
    if (!existing.isPractice && nextStage !== undefined && nextStage > existing.currentStageIdx) {
      const cards = await db.select().from(storyCards).where(and(eq(storyCards.journeyId, id), eq(storyCards.confirmed, true)));
      if (existing.currentStageIdx < 1 && nextStage >= 1 && cards.length < 2) { res.status(400).json({ error: "Please review and confirm at least two story summaries before continuing." }); return; }
      if (existing.currentStageIdx < 2 && nextStage >= 2 && !existing.patternDiscovery?.confirmed && !parsed.data.patternDiscovery?.confirmed) { res.status(400).json({ error: "Please confirm your action words and outward impact before continuing." }); return; }
      if (existing.currentStageIdx < 3 && nextStage >= 3 && !(parsed.data.purposeStatement ?? existing.purposeStatement)?.trim()) { res.status(400).json({ error: "Please confirm your purpose statement before continuing." }); return; }
    }
    if (parsed.data.patternDiscovery) {
      const discovery = parsed.data.patternDiscovery;
      if (discovery.confirmed && (!discovery.actionWords.some(word => word.trim()) || !discovery.impact.trim())) {
        res.status(400).json({ error: "An action word and an outward impact are both needed." }); return;
      }
      update.patternDiscovery = discovery;
    }
    if (parsed.data.drafts) {
      if (Object.keys(parsed.data.drafts).some(key => !STAGES.some(stage => key === stage || key === `${stage}__transcript`))) {
        res.status(400).json({ error: "Invalid draft stage." }); return;
      }
      update.drafts = { ...existing.drafts, ...parsed.data.drafts };
    }
    if (Number.isInteger(req.body.currentStageIdx) && req.body.currentStageIdx >= 0 && req.body.currentStageIdx < 6) {
      update.currentStageIdx = req.body.currentStageIdx;
    }
    if (Array.isArray(req.body.selectedPrompts)) update.selectedPrompts = req.body.selectedPrompts;
    if (Array.isArray(req.body.purposeOptions)) update.purposeOptions = req.body.purposeOptions;
    if (typeof req.body.purposeStatement === "string" || req.body.purposeStatement === null) {
      update.purposeStatement = req.body.purposeStatement;
    }
    if (req.body.season === null || (req.body.season && typeof req.body.season === "object")) update.season = req.body.season;
    if (req.body.vision === null || (req.body.vision && typeof req.body.vision === "object")) update.vision = req.body.vision;
    if (req.body.actionPlan === null || (req.body.actionPlan && typeof req.body.actionPlan === "object")) update.actionPlan = req.body.actionPlan;
    if (req.body.status === "in_progress" || req.body.status === "complete") {
      update.status = req.body.status;
      update.completedAt = req.body.status === "complete" ? new Date() : null;
    }
    update.updatedAt = new Date();

    const journey = await db.transaction(async tx => {
      if (update.patternDiscovery || update.purposeStatement !== undefined) {
        await tx.insert(discoveryRevisions).values({ journeyId: id, kind: "journey", snapshot: { patternDiscovery: existing.patternDiscovery, purposeStatement: existing.purposeStatement } });
      }
      const [saved] = await tx
      .update(journeys)
      .set({ ...update, ...(parsed.data.drafts ? { drafts: sql`${journeys.drafts} || ${JSON.stringify(parsed.data.drafts)}::jsonb` } : {}) })
      .where(and(eq(journeys.id, id), eq(journeys.userId, userId)))
      .returning();
      return saved;
    });

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

    const [journey] = await db.insert(journeys).values({ userId, isPractice: current.isPractice }).returning();
    res.status(201).json(await getJourneyPayload(journey.id));
  } catch (error) {
    next(error);
  }
});

export default router;
