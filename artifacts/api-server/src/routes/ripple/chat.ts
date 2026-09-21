import { Router } from "express";
import { STORY_PROMPT_LABELS } from "@workspace/story-prompts";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { and, count, eq, gte } from "drizzle-orm";
import { db, journeyMessages, journeys, purposeThemes, storyCards } from "@workspace/db";
import { requireAuth } from "../../middlewares/require-auth";
import { BASE_PROMPT, STAGE_PROMPTS } from "./prompts";

const router = Router();


router.post("/chat", requireAuth, async (req, res) => {
  const { stage, messages, journeyId, saveUserMessage = true } = req.body as {
    stage: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    journeyId: number;
    saveUserMessage?: boolean;
  };

  if (!stage || !Array.isArray(messages) || !STAGE_PROMPTS[stage] || messages.length > 80 ||
      messages.some((message) => typeof message.content !== "string") ||
      messages.reduce((sum, message) => sum + message.content.length, 0) > 60_000) {
    res.status(400).json({ error: "Invalid stage or missing messages" });
    return;
  }

  const userId = res.locals.user.id as string;
  const [journey] = await db
    .select()
    .from(journeys)
    .where(and(eq(journeys.id, Number(journeyId)), eq(journeys.userId, userId)))
    .limit(1);

  if (!journey) {
    res.status(404).json({ error: "Journey not found." });
    return;
  }

  const userMessage = [...messages].reverse().find((message) => message.role === "user");
  if (!userMessage || typeof userMessage.content !== "string") {
    res.status(400).json({ error: "A user message is required." });
    return;
  }
  if (userMessage.content.length > 4_000) {
    res.status(400).json({ error: "Messages must be 4,000 characters or fewer." });
    return;
  }

  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const [{ hourly = 0 } = {}, { daily = 0 } = {}] = await Promise.all([
    db
      .select({ hourly: count() })
      .from(journeyMessages)
      .innerJoin(journeys, eq(journeyMessages.journeyId, journeys.id))
      .where(
        and(
          eq(journeys.userId, userId),
           eq(journeyMessages.role, "assistant"),
          gte(journeyMessages.createdAt, oneHourAgo),
        ),
      )
      .then((rows) => rows[0]),
    db
      .select({ daily: count() })
      .from(journeyMessages)
      .innerJoin(journeys, eq(journeyMessages.journeyId, journeys.id))
      .where(
        and(
          eq(journeys.userId, userId),
           eq(journeyMessages.role, "assistant"),
          gte(journeyMessages.createdAt, oneDayAgo),
        ),
      )
      .then((rows) => rows[0]),
  ]);

  if (Number(hourly) >= 40 || Number(daily) >= 200) {
    res.status(429).json({
      error:
        "You've done a lot of meaningful reflection today. Take a breath and come back a little later to continue.",
    });
    return;
  }

  const [cards, themes] = await Promise.all([
    db.select().from(storyCards).where(eq(storyCards.journeyId, journey.id)),
    db.select().from(purposeThemes).where(eq(purposeThemes.journeyId, journey.id)),
  ]);
  const databaseContext = [
    journey.selectedPrompts.length ? `Selected story prompts: ${journey.selectedPrompts.map((id) => STORY_PROMPT_LABELS[id] ?? id).join(", ")}` : "",
    ["identify","pinpoint","personalize","live","expand"].includes(stage) ? `Story cards: ${JSON.stringify(cards)}` : "",
    ["pinpoint","personalize","live","expand"].includes(stage) ? `Purpose themes: ${JSON.stringify(themes)}` : "",
    ["personalize","live","expand"].includes(stage) && journey.purposeStatement ? `Purpose statement: ${journey.purposeStatement}` : "",
    ["live","expand"].includes(stage) && journey.season ? `Season: ${JSON.stringify(journey.season)}` : "",
    stage === "expand" && journey.actionPlan ? `Action plan: ${JSON.stringify(journey.actionPlan)}` : "",
  ].filter(Boolean).join("\n");
  const systemPrompt = BASE_PROMPT + "\n\n" + STAGE_PROMPTS[stage];
  const systemPromptWithContext = systemPrompt + (databaseContext ? `\n\nDATABASE CONTEXT:\n${databaseContext}` : "");

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
       system: systemPromptWithContext,
      messages,
    });

    let assistantReply = "";
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        assistantReply += event.delta.text;
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    const storedMessages: Array<typeof journeyMessages.$inferInsert> = [];
    if (saveUserMessage) {
      storedMessages.push({
        journeyId: journey.id,
        stage: stage as typeof journeyMessages.$inferInsert.stage,
        role: "user",
        content: userMessage.content,
      });
    }
    storedMessages.push({
      journeyId: journey.id,
      stage: stage as typeof journeyMessages.$inferInsert.stage,
      role: "assistant",
      content: assistantReply,
    });
    await db.insert(journeyMessages).values(storedMessages);

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Ripple chat error");
    if (!res.headersSent) {
      res.status(500).json({ error: "AI service error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
