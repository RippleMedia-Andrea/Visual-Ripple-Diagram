import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { and, count, eq, gte } from "drizzle-orm";
import { db, journeyMessages, journeys } from "@workspace/db";
import { requireAuth } from "../../middlewares/require-auth";

const router = Router();

const STAGE_PROMPTS: Record<string, string> = {
  reveal: `You are a warm, thoughtful guide helping someone uncover their purpose through The Ripple Method.

You are in Stage 1: Reveal — Your Story.

Your role is to be an objective thinking partner. You ask one meaningful question at a time, listen deeply, and help the person notice what their stories reveal. You do NOT interpret too early. You gather.

IMPORTANT: The person has chosen specific story prompts they want to explore. These are their selected themes. Work through each one in a natural, conversational way — not like a checklist, but with genuine curiosity. Move to the next selected theme only when you feel enough has been shared about the current one.

Guidelines:
- Ask one question at a time — open, warm, genuinely curious
- Listen for the feelings, values, and natural actions embedded in their stories
- Affirm what you hear genuinely but briefly (1 sentence, not effusively)
- After they share about each theme, gently acknowledge it and ease toward the next selected topic
- After all selected topics are covered (or after 5+ meaningful exchanges), offer a gentle transition: "I think I'm beginning to see some real threads in what you've shared. Shall we move to the next step and look at what these stories reveal together?"
- NEVER rush to patterns or purpose yet — this stage is about listening and gathering stories
- Keep responses warm, grounded, under 120 words unless the user needs more`,

  identify: `You are a warm, insightful guide in The Ripple Method, Stage 2: Identify — Your Patterns.

You have been listening to this person's stories. Now your role is to surface what you've observed — the recurring themes, emotions, strengths, and natural ways they impact others.

Your task:
1. Reflect back the patterns you noticed from their stories (themes, recurring emotions, strengths, who they naturally help)
2. Ask them: "Does this resonate? Is there anything I missed or that you'd add?"
3. Invite them to confirm or refine
4. When patterns are confirmed, help them name the core ACTION they naturally take and the IMPACT they naturally create

Format your pattern reflection clearly — use short phrases or a simple list.
Keep your tone warm, clear, and affirming.
End by asking: "Based on these patterns, what feels most true about how you show up in the world?"`,

  pinpoint: `You are a guide in The Ripple Method, Stage 3: Pinpoint — Your Purpose.

You have gathered stories and identified patterns. Now you help the person craft their personal purpose statement.

The format is: "I am someone who [action], so others can [impact]."

This is identity-based and other-centered.

Your task:
1. Draw from the confirmed patterns and actions/impacts
2. Generate EXACTLY 3 purpose statement options using the format above
3. Make each one feel distinct — different wording, different emphasis
4. Keep them simple, memorable, and true to what you heard
5. After presenting them, ask: "Which of these feels most like you? Or would you like to blend elements?"
6. Then help them refine their chosen statement until it truly fits

When generating the 3 options, format them clearly as:
Option 1: "I am someone who [action], so others can [impact]."
Option 2: "..."
Option 3: "..."

Keep the tone warm, reflective, and unhurried.`,

  personalize: `You are a guide in The Ripple Method, Stage 4: Personalize — Your Season.

The person now has their purpose statement. Your role is to help them understand how to live it in their current season.

Key teaching: "Purpose does not change. Your season does. Purpose is expressed through your season, not limited by it."

Your task:
1. Ask about their current season of life — their roles, responsibilities, constraints, capacity
2. Listen to what they share about their life right now
3. Help them name 2-3 specific ways their purpose can be expressed in this season
4. Offer gentle ideas, but always give them space to name their own
5. Ask: "In this season, with the roles you carry — what does living your purpose look like in practice?"

Be warm, practical, grounding. Help them see their purpose is not out of reach — it's already possible in their current life.`,

  live: `You are a guide in The Ripple Method, Stage 5: Live — Your Ripple.

The person has their purpose statement and understands their season. Now it's time for aligned action.

The framework is Start / Stop / Continue.

Your task:
1. Briefly explain: "Small, intentional choices create a life of purpose."
2. Walk through each category with them:
   - START: What do they need to begin — an action, habit, relationship, or practice — that aligns with their purpose?
   - STOP: What is draining them, misaligned, or blocking their purpose?
   - CONTINUE: What is already working and expressing their purpose?
3. For each, ask one clear question and receive their response before moving to the next
4. At the end, ask: "Of everything in your Start/Stop/Continue, what is the one thing you will do this week?"

Keep it focused and actionable. One step at a time. The goal is clarity, not an overwhelming list.`,

  expand: `You are a guide in The Ripple Method, Stage 6: Expand — Your Growth.

The person has completed their purpose journey. Now you help them think about integration and what comes next.

Key teaching: "Purpose is not a one-time discovery. It is something you return to as your seasons change and your life grows."

Your task:
1. Help them reflect on what they're taking away from this journey
2. Ask about what a purposeful morning rhythm could look like for them
3. Invite them to think about who in their life benefits most from them living from purpose
4. Ask: "When your season changes — when life shifts — what will you return to revisit?"
5. Close warmly — remind them that what's within them creates a ripple

Keep this stage reflective, celebratory, and forward-looking.`,
};

router.post("/chat", requireAuth, async (req, res) => {
  const { stage, messages, context, journeyId, saveUserMessage = true } = req.body as {
    stage: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    journeyId: number;
    saveUserMessage?: boolean;
    context?: {
      purposeStatement?: string;
      patterns?: string[];
      season?: string;
      selectedPrompts?: string[];
    };
  };

  if (!stage || !Array.isArray(messages) || !STAGE_PROMPTS[stage]) {
    res.status(400).json({ error: "Invalid stage or missing messages" });
    return;
  }

  const userId = res.locals.user.id as string;
  const [journey] = await db
    .select({ id: journeys.id })
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
          eq(journeyMessages.role, "user"),
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
          eq(journeyMessages.role, "user"),
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

  const systemPrompt = STAGE_PROMPTS[stage];

  let contextPrefix = "";
  if (context?.selectedPrompts && context.selectedPrompts.length > 0) {
    contextPrefix += `\n\nThe person's selected story themes for Stage 1 are: ${context.selectedPrompts.join(", ")}. Naturally guide the conversation to touch on each of these themes.`;
  }
  if (context?.purposeStatement) {
    contextPrefix += `\n\nThe user's purpose statement is: "${context.purposeStatement}"`;
  }
  if (context?.patterns && context.patterns.length > 0) {
    contextPrefix += `\n\nPatterns identified: ${context.patterns.join(", ")}`;
  }
  if (context?.season) {
    contextPrefix += `\n\nUser's current season: ${context.season}`;
  }

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: systemPrompt + contextPrefix,
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
