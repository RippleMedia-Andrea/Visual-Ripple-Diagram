import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db, discoveryRevisions, journeys, purposeThemes, storyCards } from "@workspace/db";
import { UpdateStoryCardBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/require-auth";

const router = Router();
router.use(requireAuth);
async function owns(id: number, userId: string) {
  const [row] = await db.select({ id: journeys.id }).from(journeys).where(and(eq(journeys.id, id), eq(journeys.userId, userId)));
  return row;
}
router.patch("/story-cards/:id", async (req, res, next): Promise<void> => {
  try {
    const id = Number(req.params.id), userId = res.locals.user.id as string;
    const [row] = await db.select({ card: storyCards }).from(storyCards).innerJoin(journeys, eq(storyCards.journeyId, journeys.id)).where(and(eq(storyCards.id, id), eq(journeys.userId, userId)));
    if (!row) { res.status(404).json({ error: "Story card not found." }); return; }
    const parsed = UpdateStoryCardBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Please check the story fields." }); return; }
    const update: Record<string, unknown> = { userEdited: true, updatedAt: new Date() };
    for (const [key,value] of Object.entries(parsed.data)) if (value !== undefined) update[key] = value;
    if (parsed.data.confirmed && (!row.card.summary.trim() || !row.card.actions.length || !row.card.feelings.length || !row.card.impact.length)) {
      const merged = { ...row.card, ...parsed.data };
      if (!merged.summary.trim() || !merged.actions.length || !merged.feelings.length || !merged.impact.length) { res.status(400).json({ error: "Please include what you felt, what you did, and what changed before confirming." }); return; }
    }
    if (parsed.data.confirmed === undefined && Object.keys(parsed.data).some(key => key !== "confirmed")) update.confirmed = false;
    const [card] = await db.transaction(async tx => {
      await tx.insert(discoveryRevisions).values({ journeyId: row.card.journeyId, kind: "story", snapshot: row.card });
      return tx.update(storyCards).set(update).where(eq(storyCards.id, id)).returning();
    }); res.json(card);
  } catch (e) { next(e); }
});
router.delete("/story-cards/:id", async (req, res, next): Promise<void> => {
  try {
    const id = Number(req.params.id), userId = res.locals.user.id as string;
    const [row] = await db.select({ id: storyCards.id, card: storyCards }).from(storyCards).innerJoin(journeys, eq(storyCards.journeyId, journeys.id)).where(and(eq(storyCards.id, id), eq(journeys.userId, userId)));
    if (!row) { res.status(404).json({ error: "Story card not found." }); return; }
    await db.transaction(async tx => {
      await tx.insert(discoveryRevisions).values({ journeyId: row.card.journeyId, kind: "story_removed", snapshot: row.card });
      await tx.delete(storyCards).where(eq(storyCards.id, id));
    }); res.status(204).end();
  } catch (e) { next(e); }
});
router.post("/journeys/:id/themes", async (req, res, next): Promise<void> => {
  try {
    const journeyId = Number(req.params.id), userId = res.locals.user.id as string;
    if (!(await owns(journeyId, userId))) { res.status(404).json({ error: "Journey not found." }); return; }
    const [theme] = await db.insert(purposeThemes).values({ journeyId, position: Number(req.body.position ?? 0), name: String(req.body.name ?? ""), description: String(req.body.description ?? ""), evidence: req.body.evidence ?? [], userEdited: true }).returning();
    res.status(201).json(theme);
  } catch (e) { next(e); }
});
for (const method of ["patch", "delete"] as const) router[method]("/themes/:id", async (req, res, next): Promise<void> => {
  try {
    const id = Number(req.params.id), userId = res.locals.user.id as string;
    const [row] = await db.select({ theme: purposeThemes }).from(purposeThemes).innerJoin(journeys, eq(purposeThemes.journeyId, journeys.id)).where(and(eq(purposeThemes.id, id), eq(journeys.userId, userId)));
    if (!row) { res.status(404).json({ error: "Theme not found." }); return; }
    if (method === "delete") {
      await db.transaction(async tx => {
        await tx.insert(discoveryRevisions).values({ journeyId: row.theme.journeyId, kind: "theme_removed", snapshot: row.theme });
        await tx.delete(purposeThemes).where(eq(purposeThemes.id, id));
      });
      res.status(204).end(); return;
    }
    const update: Record<string, unknown> = { userEdited: true, updatedAt: new Date() };
    for (const key of ["name","description","evidence","position"]) if (req.body[key] !== undefined) update[key] = req.body[key];
    const [theme] = await db.transaction(async tx => {
      await tx.insert(discoveryRevisions).values({ journeyId: row.theme.journeyId, kind: "theme", snapshot: row.theme });
      return tx.update(purposeThemes).set(update).where(eq(purposeThemes.id, id)).returning();
    }); res.json(theme);
  } catch (e) { next(e); }
});
export default router;