import { Router } from "express";
import { and, asc, count, eq, gte } from "drizzle-orm";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { db, journeyMessages, journeys, purposeThemes, storyCards } from "@workspace/db";
import { requireAuth } from "../../middlewares/require-auth";

const router = Router();
const calls = new Map<string, number[]>();
const stages = ["reveal", "identify", "personalize", "live"] as const;

function containsUnknown(value: unknown): boolean {
  if (typeof value === "string") {
    return /<?unknown>?/i.test(value);
  }
  if (Array.isArray(value)) return value.some(containsUnknown);
  if (value && typeof value === "object") return Object.values(value).some(containsUnknown);
  return false;
}

router.post("/journeys/:id/discoveries/:stage", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const stage = req.params.stage as string;
    const journeyId = Number(req.params.id);
    if (!stages.includes(stage as never)) { res.status(400).json({ error: "Invalid extraction stage." }); return; }
    const userId = res.locals.user.id as string;
    const [journey] = await db.select().from(journeys).where(and(eq(journeys.id, Number(journeyId)), eq(journeys.userId, userId)));
    if (!journey) { res.status(404).json({ error: "Journey not found." }); return; }
    const now = Date.now(), recent = (calls.get(userId) ?? []).filter((time) => now - time < 3600000);
    if (recent.length >= 20) { res.status(429).json({ error: "Extraction limit reached. Try again later." }); return; }
    recent.push(now); calls.set(userId, recent);
    const messages = await db.select({ role: journeyMessages.role, content: journeyMessages.content }).from(journeyMessages).where(and(eq(journeyMessages.journeyId, journey.id), eq(journeyMessages.stage, stage as typeof journeyMessages.$inferSelect.stage))).orderBy(asc(journeyMessages.createdAt));
    const [savedStories, savedThemes] = await Promise.all([
      db.select().from(storyCards).where(eq(storyCards.journeyId, journey.id)).orderBy(asc(storyCards.position)),
      db.select().from(purposeThemes).where(eq(purposeThemes.journeyId, journey.id)).orderBy(asc(purposeThemes.position)),
    ]);
    const discoveryContext = [
      stage !== "reveal" && savedStories.length ? `Saved story cards: ${JSON.stringify(savedStories)}` : "",
      ["personalize", "live"].includes(stage) && savedThemes.length ? `Saved purpose themes: ${JSON.stringify(savedThemes)}` : "",
      ["personalize", "live"].includes(stage) && journey.purposeStatement ? `Purpose statement: ${journey.purposeStatement}` : "",
      stage === "live" && journey.season ? `Current season: ${JSON.stringify(journey.season)}` : "",
    ].filter(Boolean).join("\n");
    const schemas: Record<string, object> = {
      reveal: { type: "object", properties: { stories: { type: "array", items: { type: "object", properties: { title:{type:"string"}, summary:{type:"string"}, promptId:{type:["string","null"]}, isDifficultExperience:{type:"boolean"}, actions:{type:"array",items:{type:"string"}}, feelings:{type:"array",items:{type:"string"}}, people:{type:"array",items:{type:"string"}}, impact:{type:"array",items:{type:"string"}} }, required:["title","summary","promptId","isDifficultExperience","actions","feelings","people","impact"] } } }, required:["stories"] },
      identify: { type: "object", properties: { themes: { type: "array", items: { type:"object", properties:{name:{type:"string"},description:{type:"string"},evidence:{type:"array",items:{type:"object",properties:{storyTitle:{type:"string"},detail:{type:"string"}},required:["storyTitle","detail"]}}},required:["name","description","evidence"] } } },required:["themes"] },
      personalize: { type:"object", properties:{season:{type:"object",properties:{summary:{type:"string"},roles:{type:"array",items:{type:"string"}},capacity:{type:"string"},constraints:{type:"array",items:{type:"string"}},opportunities:{type:"array",items:{type:"string"}},expressions:{type:"array",items:{type:"string"}}},required:["summary","roles","capacity","constraints","opportunities","expressions"]}},required:["season"] },
      live: { type:"object", properties:{actionPlan:{type:"object",properties:{start:{type:"array",items:{type:"string"}},stop:{type:"array",items:{type:"string"}},continue:{type:"array",items:{type:"string"}},oneStepThisWeek:{type:"string"}},required:["start","stop","continue","oneStepThisWeek"]}},required:["actionPlan"] },
    };
    const response = await anthropic.messages.create({ model:"claude-sonnet-4-6", max_tokens:2000, system:"You are organizing what a person shared during a purpose-discovery conversation. Only include things the person actually said or clearly confirmed. Use their own words whenever possible. Do not invent, embellish, or add interpretation that wasn't discussed. Keep each list item short (2–8 words). If something wasn't covered, leave it empty.", messages:[{role:"user",content:`${discoveryContext ? `${discoveryContext}\n\n` : ""}Transcript:\n${messages.map((m)=>`${m.role}: ${m.content}`).join("\n")}\n\nNever return placeholder text such as <UNKNOWN>. Omit unsupported items instead. If no evidence can be tied to a saved story, return an empty evidence array.`}], tools:[{name:"extract_discoveries",description:"Return structured discoveries without placeholder values.",input_schema:schemas[stage] as never}], tool_choice:{type:"tool",name:"extract_discoveries"} });
    const block = response.content.find((item) => item.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("Extraction returned no structured data.");
    const data = block.input as any;
    if (containsUnknown(data)) throw new Error("Extraction returned incomplete data.");
    await db.transaction(async (tx) => {
      if (stage === "reveal") {
        await tx.delete(storyCards).where(eq(storyCards.journeyId, journey.id));
        if (data.stories.length) await tx.insert(storyCards).values(data.stories.map((s:any,i:number)=>({...s,journeyId:journey.id,position:i})));
      }
      if (stage === "identify") {
        await tx.delete(purposeThemes).where(eq(purposeThemes.journeyId, journey.id));
        if (data.themes.length) await tx.insert(purposeThemes).values(data.themes.map((t:any,i:number)=>({...t,journeyId:journey.id,position:i})));
      }
      if (stage === "personalize") await tx.update(journeys).set({season:data.season,updatedAt:new Date()}).where(eq(journeys.id,journey.id));
      if (stage === "live") await tx.update(journeys).set({actionPlan:data.actionPlan,updatedAt:new Date()}).where(eq(journeys.id,journey.id));
    });
    res.json(data);
  } catch (e) { next(e); }
});
export default router;