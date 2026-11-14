import { Router } from "express";
import { and, asc, count, eq, gte } from "drizzle-orm";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { db, discoveryRevisions, journeyMessages, journeys, purposeThemes, storyCards } from "@workspace/db";
import { z } from "zod";
import { requireAiConsent, requireAuth } from "../../middlewares/require-auth";
import { containsUnknown } from "../../lib/discovery-validation";

const router = Router();
const calls = new Map<string, number[]>();
const stages = ["reveal", "identify", "picture", "personalize", "live"] as const;
export const EXTRACTION_PROMPT = "You organize a person's purpose conversation, never interpret it. Include only what they said or clearly confirmed, in their own words. Never invent details, diagnose, counsel, explain trauma, teach, preach, or give advice. For Reveal return each distinct story once, with the same stable title as any supplied saved story. Put What you felt in feelings, What you did in actions, and What changed in impact. Return a short summary using those three headings. A change for the person themselves is valid in Reveal; do not invent outward impact. Include summaries awaiting confirmation so the person can correct them in the review. Never mark a story confirmed yourself. For Identify preserve evidence from their stories and only include observations they accepted. Keep list items short. If something was not covered, leave it empty. No placeholder values, hyphens, or em dashes. Say fulfilled life, never best life.";
const extractedStories = z.object({ stories: z.array(z.object({
  title: z.string().min(1).max(300), summary: z.string().max(12000),
  promptId: z.string().nullable(), isDifficultExperience: z.boolean(),
  actions: z.array(z.string()), feelings: z.array(z.string()),
  people: z.array(z.string()), impact: z.array(z.string()),
})).max(50) });

router.post("/journeys/:id/discoveries/:stage", requireAuth, requireAiConsent, async (req, res, next): Promise<void> => {
  try {
    const stage = req.params.stage as string;
    const journeyId = Number(req.params.id);
    if (!stages.includes(stage as never)) { res.status(400).json({ error: "Invalid extraction stage." }); return; }
    const userId = res.locals.user.id as string;
    const [journey] = await db.select().from(journeys).where(and(eq(journeys.id, Number(journeyId)), eq(journeys.userId, userId)));
    if (!journey) { res.status(404).json({ error: "Journey not found." }); return; }
    const messages = await db.select({ role: journeyMessages.role, content: journeyMessages.content, createdAt: journeyMessages.createdAt }).from(journeyMessages).where(and(eq(journeyMessages.journeyId, journey.id), eq(journeyMessages.stage, stage as typeof journeyMessages.$inferSelect.stage))).orderBy(asc(journeyMessages.createdAt));
    const [savedStories, savedThemes] = await Promise.all([
      db.select().from(storyCards).where(eq(storyCards.journeyId, journey.id)).orderBy(asc(storyCards.position)),
      db.select().from(purposeThemes).where(eq(purposeThemes.journeyId, journey.id)).orderBy(asc(purposeThemes.position)),
    ]);
    const latestMessageAt = messages.at(-1)?.createdAt?.getTime() ?? 0;
    const fallbackSavedAt = stage === "reveal"
      ? Math.max(0, ...savedStories.map((story) => story.updatedAt.getTime()))
      : stage === "identify"
        ? Math.max(0, ...savedThemes.map((theme) => theme.updatedAt.getTime()))
        : journey.updatedAt.getTime();
    const extractedAt = stage === "reveal"
      ? journey.revealExtractedAt
      : stage === "identify"
        ? journey.identifyExtractedAt
        : stage === "picture"
          ? journey.pictureExtractedAt
        : stage === "personalize"
          ? journey.personalizeExtractedAt
          : journey.liveExtractedAt;
    const hasSavedDiscovery = stage === "reveal"
      ? savedStories.length > 0
      : stage === "identify"
        ? savedThemes.length > 0
        : stage === "picture"
          ? Boolean(journey.vision)
        : stage === "personalize"
          ? Boolean(journey.season)
          : Boolean(journey.actionPlan || journey.season);
    if (hasSavedDiscovery && latestMessageAt <= (extractedAt?.getTime() ?? fallbackSavedAt)) {
      if (stage === "reveal") { res.json({ stories: savedStories }); return; }
      if (stage === "identify") { res.json({ themes: savedThemes }); return; }
      if (stage === "picture") { res.json({ vision: journey.vision }); return; }
      if (stage === "personalize") { res.json({ season: journey.season }); return; }
      res.json({ actionPlan: journey.actionPlan, season: journey.season }); return;
    }
    const now = Date.now(), recent = (calls.get(userId) ?? []).filter((time) => now - time < 3600000);
    if (recent.length >= 20) { res.status(429).json({ error: "Extraction limit reached. Try again later." }); return; }
    recent.push(now); calls.set(userId, recent);
    const discoveryContext = [
      savedStories.length ? `Saved story cards, retain their titles for the same story: ${JSON.stringify(savedStories)}` : "",
      ["picture", "personalize", "live"].includes(stage) && savedThemes.length ? `Saved purpose themes: ${JSON.stringify(savedThemes)}` : "",
      ["picture", "personalize", "live"].includes(stage) && journey.purposeStatement ? `Purpose statement: ${journey.purposeStatement}` : "",
      stage === "live" && journey.season ? `Current season: ${JSON.stringify(journey.season)}` : "",
    ].filter(Boolean).join("\n");
    const schemas: Record<string, object> = {
      picture: { type: "object", properties: { vision: { type: "object", properties: { picture: { type: "string" }, influences: { type: "string" }, beforeStarting: { type: "string" } }, required: ["picture", "influences", "beforeStarting"] } }, required: ["vision"] },
      reveal: { type: "object", properties: { stories: { type: "array", items: { type: "object", properties: { title:{type:"string"}, summary:{type:"string"}, promptId:{type:["string","null"]}, isDifficultExperience:{type:"boolean"}, actions:{type:"array",items:{type:"string"}}, feelings:{type:"array",items:{type:"string"}}, people:{type:"array",items:{type:"string"}}, impact:{type:"array",items:{type:"string"}} }, required:["title","summary","promptId","isDifficultExperience","actions","feelings","people","impact"] } } }, required:["stories"] },
      identify: { type: "object", properties: { themes: { type: "array", items: { type:"object", properties:{name:{type:"string"},description:{type:"string"},evidence:{type:"array",items:{type:"object",properties:{storyTitle:{type:"string"},detail:{type:"string"}},required:["storyTitle","detail"]}}},required:["name","description","evidence"] } } },required:["themes"] },
      personalize: { type:"object", properties:{season:{type:"object",properties:{summary:{type:"string"},roles:{type:"array",items:{type:"string"}},capacity:{type:"string"},constraints:{type:"array",items:{type:"string"}},opportunities:{type:"array",items:{type:"string"}},expressions:{type:"array",items:{type:"string"}}},required:["summary","roles","capacity","constraints","opportunities","expressions"]}},required:["season"] },
      live: { type:"object", properties:{actionPlan:{type:"object",properties:{start:{type:"array",items:{type:"string"}},stop:{type:"array",items:{type:"string"}},continue:{type:"array",items:{type:"string"}},oneStepThisWeek:{type:"string"}},required:["start","stop","continue","oneStepThisWeek"]}},required:["actionPlan"] },
    };
    const seasonSchema = (schemas.personalize as any).properties.season;
    (schemas.live as any).properties.season = seasonSchema;
    (schemas.live as any).required.push("season");
    const response = await anthropic.messages.create({ model:"claude-sonnet-4-6", max_tokens:4000, system:EXTRACTION_PROMPT, messages:[{role:"user",content:`${discoveryContext ? `${discoveryContext}\n\n` : ""}Transcript:\n${messages.map((m)=>`${m.role}: ${m.content}`).join("\n")}\n\nNever return placeholder text such as <UNKNOWN>. Omit unsupported items instead. If no evidence can be tied to a saved story, return an empty evidence array.`}], tools:[{name:"extract_discoveries",description:"Return structured discoveries without placeholder values.",input_schema:schemas[stage] as never}], tool_choice:{type:"tool",name:"extract_discoveries"} });
    const block = response.content.find((item) => item.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("Extraction returned no structured data.");
    const data = block.input as any;
    if (containsUnknown(data)) throw new Error("Extraction returned incomplete data.");
    if (stage === "reveal") extractedStories.parse(data);
    await db.transaction(async (tx) => {
      const extractionTime = new Date();
      await tx.insert(discoveryRevisions).values({ journeyId: journey.id, kind: `${stage}_extraction`, snapshot: { before: { stories: savedStories, themes: savedThemes, patternDiscovery: journey.patternDiscovery, vision: journey.vision, season: journey.season, actionPlan: journey.actionPlan }, proposed: data } });
      if (stage === "reveal") {
        const parsed = extractedStories.parse(data);
        let position = Math.max(-1, ...savedStories.map(s => s.position)) + 1;
        for (const story of parsed.stories) {
          const existing = savedStories.find(s => s.title.trim().toLowerCase() === story.title.trim().toLowerCase());
          // Confirmed or manually edited discoveries are never silently replaced.
          if (existing?.confirmed || existing?.userEdited) continue;
          if (existing) await tx.update(storyCards).set({ ...story, confirmed: false, updatedAt: extractionTime }).where(eq(storyCards.id, existing.id));
          else await tx.insert(storyCards).values({ ...story, journeyId: journey.id, position: position++ });
        }
        await tx.update(journeys).set({ revealExtractedAt: extractionTime, updatedAt: extractionTime }).where(eq(journeys.id, journey.id));
      }
      if (stage === "identify") {
        const newThemes = data.themes.filter((theme: { name: string }) => !savedThemes.some(saved => saved.name.trim().toLowerCase() === theme.name.trim().toLowerCase()));
        if (newThemes.length) await tx.insert(purposeThemes).values(newThemes.map((t:any,i:number)=>({...t,journeyId:journey.id,position:savedThemes.length+i})));
        await tx.update(journeys).set({ identifyExtractedAt: extractionTime, updatedAt: extractionTime }).where(eq(journeys.id, journey.id));
      }
      if (stage === "personalize") await tx.update(journeys).set({ season: data.season, personalizeExtractedAt: extractionTime, updatedAt: extractionTime }).where(eq(journeys.id, journey.id));
      if (stage === "picture") await tx.update(journeys).set({ vision: data.vision, pictureExtractedAt: extractionTime, updatedAt: extractionTime }).where(eq(journeys.id, journey.id));
      if (stage === "live") await tx.update(journeys).set({ season: data.season, actionPlan: data.actionPlan, liveExtractedAt: extractionTime, updatedAt: extractionTime }).where(eq(journeys.id, journey.id));
    });
    res.json(data);
  } catch (e) { next(e); }
});
export default router;