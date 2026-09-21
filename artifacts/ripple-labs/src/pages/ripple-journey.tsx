import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import rippleLabsLogo from "@assets/2876A1D3-1596-40F7-9384-F5AAA5F311E8_1777042604510.png";
import { StageChat, type ChatMessage } from "@/components/StageChat";
import { AccountMenu } from "@/components/AccountMenu";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

const STORY_PROMPTS = [
  {
    id: "alive",
    label: "A moment I felt most alive",
    description: "When were you most fully yourself? What were you doing, and who were you with?",
  },
  {
    id: "shaped",
    label: "An experience that quietly shaped me",
    description: "An early memory or moment — big or small — that made you who you are.",
  },
  {
    id: "challenge",
    label: "A challenge that revealed my strength",
    description: "A difficulty you walked through and what it showed you about yourself.",
  },
  {
    id: "difference",
    label: "A time I made a real difference",
    description: "When did you know your presence or action truly mattered to someone else?",
  },
  {
    id: "shifted",
    label: "A moment when everything shifted",
    description: "Before and after. What changed? What became possible that wasn't before?",
  },
  {
    id: "natural",
    label: "Something I do that comes naturally",
    description: "What do others ask you for or notice about you that feels effortless to you?",
  },
  {
    id: "care",
    label: "Something I've always cared about",
    description: "A cause, a person, a gap in the world that has always pulled at you.",
  },
  {
    id: "memory",
    label: "A memory I keep returning to",
    description: "One that still holds meaning — even if you can't fully explain why.",
  },
];

const STAGES = [
  {
    id: "reveal",
    number: "01",
    title: "Reveal",
    subtitle: "Your Story",
    belief: "Your story holds clues.",
    teaching:
      "Every experience — the highs, the lows, the moments that made you come alive — contains a thread of your purpose. We begin here, with your story.",
    guidance: "Share freely. Your guide will listen, ask questions, and help you notice what your stories reveal.",
    color: "#0F2A36",
    textColor: "#ffffff",
    cardBg: "rgba(255,255,255,0.06)",
    placeholder: "Start by sharing a moment when you felt most alive, most yourself...",
    openingPrompt: "I'd love to begin by hearing a bit about you. Can you share a moment — any moment in your life — when you felt most alive, most fully yourself? It doesn't have to be dramatic. Even a quiet, ordinary moment counts.",
  },
  {
    id: "identify",
    number: "02",
    title: "Identify",
    subtitle: "Your Patterns",
    belief: "Patterns reveal purpose.",
    teaching:
      "Across your stories there are recurring themes — emotions you keep feeling, actions you naturally take, ways you impact others. These patterns are fingerprints of your purpose.",
    guidance: "Your guide will reflect back what they heard and help you name the patterns. Confirm, add, or refine.",
    color: "#1a4a55",
    textColor: "#ffffff",
    cardBg: "rgba(255,255,255,0.06)",
    placeholder: "Does this resonate? What would you add or change?",
    openingPrompt: null,
  },
  {
    id: "pinpoint",
    number: "03",
    title: "Pinpoint",
    subtitle: "Your Purpose",
    belief: "You are naming who you already are.",
    teaching:
      "Your purpose statement begins with identity and ends with impact. It is not just what you do — it reflects who you are and how your life helps others.",
    guidance: "Your guide will offer 3 purpose statement options. Choose one as a starting point, then make it fully yours.",
    color: "#2F7F7B",
    textColor: "#ffffff",
    cardBg: "rgba(255,255,255,0.08)",
    placeholder: "How does this feel? Which option resonates? Or share what you'd change...",
    openingPrompt: null,
  },
  {
    id: "personalize",
    number: "04",
    title: "Personalize",
    subtitle: "Your Season",
    belief: "Purpose is expressed through your season, not limited by it.",
    teaching:
      "Roles and seasons change. Purpose does not. But how your purpose shows up changes with each chapter of your life.",
    guidance: "Describe your life right now — your roles, responsibilities, and what your season looks like. Your guide will help you find purposeful expression in it.",
    color: "#5FA8A5",
    textColor: "#0F2A36",
    cardBg: "rgba(15,42,54,0.06)",
    placeholder: "Tell me about your life right now — your roles, your season...",
    openingPrompt: null,
  },
  {
    id: "live",
    number: "05",
    title: "Live",
    subtitle: "Your Ripple",
    belief: "Small actions create a life of purpose.",
    teaching:
      "Clarity becomes powerful when it turns into action. Some things need to begin. Some need to stop. Some are already working.",
    guidance: "Work through Start / Stop / Continue with your guide. One clear action at a time.",
    color: "#9fd0cd",
    textColor: "#0F2A36",
    cardBg: "rgba(15,42,54,0.06)",
    placeholder: "Share what comes to mind...",
    openingPrompt: null,
  },
  {
    id: "expand",
    number: "06",
    title: "Expand",
    subtitle: "Your Growth",
    belief: "What's within you creates a ripple.",
    teaching:
      "Purpose is not a one-time discovery. It grows with you as your seasons change. Your job now is to live it, return to it, and let it ripple outward.",
    guidance: "Reflect on what you're taking away. Your guide will help you close this season of the journey.",
    color: "#EEE9DB",
    textColor: "#0F2A36",
    cardBg: "rgba(15,42,54,0.05)",
    placeholder: "Share what you're taking away from this journey...",
    openingPrompt: null,
  },
];

function extractPurposeOptions(messages: ChatMessage[]): string[] {
  const options: string[] = [];
  const allText = messages
    .filter((m) => m.role === "assistant")
    .map((m) => m.content)
    .join("\n");

  const regex = /Option\s*\d[:\.]?\s*[""]?(I am someone who[^"".\n]+(?:so others can[^"".\n]+)?)["".]?/gi;
  let match;
  while ((match = regex.exec(allText)) !== null) {
    const stmt = match[1].trim().replace(/["""]/g, "");
    if (stmt && !options.includes(stmt)) options.push(stmt);
  }

  if (options.length === 0) {
    const lineRegex = /[""]?(I am someone who[^"""\n]{10,})[""".]?/gi;
    while ((match = lineRegex.exec(allText)) !== null) {
      const stmt = match[1].trim().replace(/["""]/g, "");
      if (stmt && !options.includes(stmt) && options.length < 3) options.push(stmt);
    }
  }

  return options.slice(0, 3);
}

interface JourneyContext {
  purposeStatement: string;
  purposeOptions: string[];
  patterns: string;
  season: string;
  startItems: string;
  stopItems: string;
  continueItems: string;
}

type AllMessages = ChatMessage[][];

interface JourneyResponse {
  id: number;
  currentStageIdx: number;
  selectedPrompts: string[];
  purposeOptions: string[];
  purposeStatement: string | null;
  messages: Record<string, ChatMessage[]>;
}

const emptyMessages = (): AllMessages => STAGES.map(() => []);
const emptyContext = (): JourneyContext => ({
  purposeStatement: "",
  purposeOptions: [],
  patterns: "",
  season: "",
  startItems: "",
  stopItems: "",
  continueItems: "",
});

export default function RippleJourney() {
  const [journeyId, setJourneyId] = useState<number | null>(null);
  const [isLoadingJourney, setIsLoadingJourney] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [stageIdx, setStageIdx] = useState(0);
  const [highestStageIdx, setHighestStageIdx] = useState(0);
  const [allMessages, setAllMessages] = useState<AllMessages>(emptyMessages);
  const [context, setContext] = useState<JourneyContext>(emptyContext);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Stage 1: prompt selection
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [promptsConfirmed, setPromptsConfirmed] = useState(false);

  // Stage-3-specific: purpose picker UI
  const [purposeOptions, setPurposeOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [editedPurpose, setEditedPurpose] = useState("");
  const [purposeConfirmed, setPurposeConfirmed] = useState(false);

  // Stage-5-specific: structured SSC
  const [sscMode, setSscMode] = useState<"chat" | "structured">("chat");

  const stage = STAGES[stageIdx];

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_URL}/api/journeys/current`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load your journey.");
        return (await response.json()) as JourneyResponse;
      })
      .then((journey) => {
        if (cancelled) return;
        const messages = STAGES.map((item) => journey.messages[item.id] ?? []);
        const purposeStatement = journey.purposeStatement ?? "";
        setJourneyId(journey.id);
        setStageIdx(journey.currentStageIdx);
        setHighestStageIdx(journey.currentStageIdx);
        setAllMessages(messages);
        setSelectedPrompts(journey.selectedPrompts ?? []);
        setPromptsConfirmed(
          (journey.selectedPrompts?.length ?? 0) >= 2 && messages[0].length > 0,
        );
        setPurposeOptions(journey.purposeOptions ?? []);
        setEditedPurpose(purposeStatement);
        setPurposeConfirmed(Boolean(purposeStatement));
        setContext((previous) => ({
          ...previous,
          purposeOptions: journey.purposeOptions ?? [],
          purposeStatement,
        }));
        setIsLoadingJourney(false);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setLoadError(error.message);
        setIsLoadingJourney(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!journeyId || isLoadingJourney) return;
    const timeout = window.setTimeout(() => {
      fetch(`${BASE_URL}/api/journeys/${journeyId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStageIdx: highestStageIdx,
          selectedPrompts,
          purposeOptions,
          purposeStatement: context.purposeStatement || null,
        }),
      }).catch(() => {});
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [
    journeyId,
    isLoadingJourney,
    highestStageIdx,
    selectedPrompts,
    purposeOptions,
    context.purposeStatement,
  ]);

  // Auto-open each stage — send opening prompt if messages are empty
  const hasOpened = useRef<Record<number, boolean>>({});

  const sendOpening = useCallback(
    async (idx: number) => {
      if (hasOpened.current[idx]) return;
      const s = STAGES[idx];
      if (!s.openingPrompt && idx > 0) {
        hasOpened.current[idx] = true;
        return;
      }
      const openingMsg = s.openingPrompt;
      if (!openingMsg) { hasOpened.current[idx] = true; return; }
      if (allMessages[idx].length > 0) { hasOpened.current[idx] = true; return; }

      hasOpened.current[idx] = true;
      setIsStreaming(true);

      try {
        const res = await fetch(`${BASE_URL}/api/ripple/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            journeyId,
            stage: s.id,
            messages: [{ role: "user", content: "__OPEN__" }],
            context: buildContext(idx),
            saveUserMessage: false,
          }),
        });

        if (!res.ok || !res.body) throw new Error("Stream error");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) text += data.content;
              if (data.done) {
                setAllMessages((prev) => {
                  const next = [...prev];
                  next[idx] = [{ role: "assistant", content: text }];
                  return next;
                });
                setIsStreaming(false);
              }
            } catch {}
          }
        }
      } catch {
        setAllMessages((prev) => {
          const next = [...prev];
          next[idx] = [{ role: "assistant", content: openingMsg }];
          return next;
        });
        setIsStreaming(false);
      }
    },
    [allMessages, journeyId]
  );

  // Stage 0 no longer auto-opens — user must select prompts first
  async function triggerRevealOpening(prompts: string[]) {
    if (allMessages[0].length > 0) return;
    const promptLabels = prompts
      .map((id) => STORY_PROMPTS.find((p) => p.id === id)?.label ?? id)
      .join(", ");
    const openingText = `The person has chosen to share stories around these themes: ${promptLabels}. Please warmly welcome them to Stage 1: Reveal — Your Story. Acknowledge the themes they chose, then gently invite them to begin with whichever one feels most natural right now. Ask one open, warm question to get them started. Keep your opening under 100 words.`;
    await streamAIOpening("reveal", openingText, 0, { selectedPrompts: prompts, purposeStatement: "", patterns: [], season: "" });
  }

  function confirmAndBegin() {
    if (selectedPrompts.length < 2) return;
    setPromptsConfirmed(true);
    triggerRevealOpening(selectedPrompts);
  }

  function buildContext(idx: number) {
    return {
      purposeStatement: context.purposeStatement,
      patterns: context.patterns ? [context.patterns] : [],
      season: context.season,
      selectedPrompts,
    };
  }

  // When stage changes to Identify, auto-launch with full Stage 1 conversation
  useEffect(() => {
    if (stageIdx === 1 && allMessages[1].length === 0 && !isStreaming) {
      triggerIdentifyOpening();
    }
    if (stageIdx === 2 && allMessages[2].length === 0 && !isStreaming) {
      triggerPinpointOpening();
    }
    if (stageIdx === 3 && allMessages[3].length === 0 && !isStreaming) {
      triggerPersonalizeOpening();
    }
    if (stageIdx === 4 && allMessages[4].length === 0 && !isStreaming) {
      triggerLiveOpening();
    }
    if (stageIdx === 5 && allMessages[5].length === 0 && !isStreaming) {
      triggerExpandOpening();
    }
  }, [stageIdx]);

  async function streamAIOpening(stageId: string, prompt: string, idx: number, ctx?: object) {
    if (allMessages[idx].length > 0) return;
    setIsStreaming(true);
    try {
      const res = await fetch(`${BASE_URL}/api/ripple/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journeyId,
          stage: stageId,
          messages: [{ role: "user", content: prompt }],
          context: ctx ?? buildContext(idx),
          saveUserMessage: false,
        }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.content) text += d.content;
            if (d.done) {
              setAllMessages((prev) => {
                const next = [...prev];
                next[idx] = [{ role: "assistant", content: text }];
                return next;
              });
              setIsStreaming(false);
            }
          } catch {}
        }
      }
    } catch {
      setIsStreaming(false);
    }
  }

  function triggerIdentifyOpening() {
    const revealSummary = allMessages[0]
      .map((m) => `${m.role === "user" ? "Person" : "Guide"}: ${m.content}`)
      .join("\n\n");
    streamAIOpening(
      "identify",
      `Here is the full conversation from Stage 1 where the person shared their stories:\n\n${revealSummary}\n\nPlease reflect back the patterns, themes, and recurring elements you noticed. Present them clearly, then ask the person to confirm or refine.`,
      1
    );
  }

  function triggerPinpointOpening() {
    const patternsSummary = allMessages[1]
      .map((m) => `${m.role === "user" ? "Person" : "Guide"}: ${m.content}`)
      .join("\n\n");
    streamAIOpening(
      "pinpoint",
      `Based on these confirmed patterns:\n\n${patternsSummary}\n\nPlease generate exactly 3 purpose statement options using the format: "I am someone who [action], so others can [impact]." Present them clearly labeled as Option 1, Option 2, and Option 3.`,
      2
    );
  }

  function triggerPersonalizeOpening() {
    streamAIOpening(
      "personalize",
      `The person's purpose statement is: "${context.purposeStatement || editedPurpose}"\n\nPlease begin Stage 4: Personalize — Your Season. Start by asking about their current season of life and roles.`,
      3,
      {
        purposeStatement: context.purposeStatement || editedPurpose,
        patterns: context.patterns ? [context.patterns] : [],
        season: context.season,
      }
    );
  }

  function triggerLiveOpening() {
    streamAIOpening(
      "live",
      `The person's purpose statement is: "${context.purposeStatement}"\nTheir current season: "${context.season}"\n\nPlease begin Stage 5: Live — Your Ripple. Start by introducing the Start / Stop / Continue framework and asking the first question.`,
      4,
      {
        purposeStatement: context.purposeStatement,
        patterns: context.patterns ? [context.patterns] : [],
        season: context.season,
      }
    );
  }

  function triggerExpandOpening() {
    streamAIOpening(
      "expand",
      `The person has completed all stages of The Ripple Method. Their purpose statement is: "${context.purposeStatement}". Their season is: "${context.season}". Please begin Stage 6: Expand — Your Growth. Celebrate what they've done and guide them into reflection and integration.`,
      5,
      {
        purposeStatement: context.purposeStatement,
        patterns: context.patterns ? [context.patterns] : [],
        season: context.season,
      }
    );
  }

  // Detect purpose options after stage 2 AI responses
  useEffect(() => {
    if (stageIdx === 2) {
      const opts = extractPurposeOptions(allMessages[2]);
      if (opts.length > 0) {
        setPurposeOptions(opts);
        setContext((prev) => ({ ...prev, purposeOptions: opts }));
      }
    }
  }, [allMessages[2]]);

  function updateStageMessages(idx: number, msgs: ChatMessage[]) {
    setAllMessages((prev) => {
      const next = [...prev];
      next[idx] = msgs;
      return next;
    });
  }

  function goNext() {
    if (stageIdx >= STAGES.length - 1) {
      setIsComplete(true);
      if (journeyId) {
        fetch(`${BASE_URL}/api/journeys/${journeyId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "complete", currentStageIdx: 5 }),
        }).catch(() => {});
      }
    } else {
      const next = stageIdx + 1;
      setHighestStageIdx((current) => Math.max(current, next));
      setStageIdx(next);
    }
  }

  function goPrev() {
    if (stageIdx > 0) setStageIdx((i) => i - 1);
  }

  function confirmPurpose() {
    const stmt = editedPurpose.trim() || selectedOption;
    if (!stmt) return;
    setContext((prev) => ({ ...prev, purposeStatement: stmt }));
    setPurposeConfirmed(true);
  }

  async function resetJourney() {
    if (!journeyId) return;
    const response = await fetch(`${BASE_URL}/api/journeys/${journeyId}/restart`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) return;
    const next = (await response.json()) as JourneyResponse;
    setJourneyId(next.id);
    setStageIdx(0);
    setHighestStageIdx(0);
    setAllMessages(emptyMessages());
    setContext(emptyContext());
    setPurposeOptions([]);
    setSelectedOption("");
    setEditedPurpose("");
    setPurposeConfirmed(false);
    setSelectedPrompts([]);
    setPromptsConfirmed(false);
    setIsComplete(false);
    hasOpened.current = {};
  }

  if (isLoadingJourney) {
    return (
      <div className="min-h-screen bg-[#0F2A36] text-[#D7ECEB] flex items-center justify-center font-sans">
        Loading your journey…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0F2A36] text-[#D7ECEB] flex items-center justify-center px-6 font-sans text-center">
        {loadError} Please refresh and try again.
      </div>
    );
  }

  if (isComplete) {
    return <JourneySummary context={context} allMessages={allMessages} onReset={resetJourney} />;
  }

  const progressPct = ((stageIdx + 1) / STAGES.length) * 100;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: stage.color }}
      data-testid="ripple-journey-page"
    >
      {/* Nav */}
      <nav
        className="w-full px-5 md:px-10 py-3 flex items-center justify-between sticky top-0 z-50"
        style={{ backgroundColor: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}
        data-testid="journey-nav"
      >
        <Link href="/">
          <img
            src={rippleLabsLogo}
            alt="Ripple Labs"
            className="h-7 w-auto object-contain rounded-md cursor-pointer"
            data-testid="nav-logo"
          />
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs font-sans opacity-50" style={{ color: stage.textColor }}>
            The Ripple Method™ Journey
          </span>
          <Link
            href="/purpose-lab"
            className="text-xs font-sans opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: stage.textColor }}
          >
            ← Purpose Lab
          </Link>
          <AccountMenu color={stage.textColor} />
        </div>
      </nav>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${progressPct}%`, backgroundColor: "#C8A96A" }}
          data-testid="progress-bar"
        />
      </div>

      {/* Stage dots */}
      <div className="flex items-center justify-center gap-2 pt-4 px-5">
        {STAGES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => !isStreaming && i <= highestStageIdx && setStageIdx(i)}
            data-testid={`stage-dot-${s.id}`}
            className="flex items-center gap-1.5 transition-all"
            disabled={isStreaming || i > highestStageIdx}
          >
            <div
              className={`rounded-full transition-all duration-300 flex items-center justify-center text-[9px] font-bold ${
                i === stageIdx
                  ? "w-7 h-7 shadow-lg"
                  : i < stageIdx
                  ? "w-5 h-5"
                  : "w-4 h-4 opacity-30"
              }`}
              style={{
                backgroundColor: i <= stageIdx ? "#C8A96A" : "rgba(255,255,255,0.2)",
                color: "#0F2A36",
              }}
            >
              {i < stageIdx ? "✓" : i === stageIdx ? s.number : ""}
            </div>
            {i < STAGES.length - 1 && (
              <div
                className="w-5 md:w-10 h-px"
                style={{
                  backgroundColor: i < stageIdx ? "#C8A96A" : "rgba(255,255,255,0.15)",
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 md:px-8 lg:px-12 py-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

          {/* Left: Stage info */}
          <div className="space-y-4">
            <div>
              <p
                className="text-[10px] font-sans uppercase tracking-widest mb-1"
                style={{ color: stage.textColor, opacity: 0.45 }}
              >
                Stage {stage.number}
              </p>
              <h1
                className="text-2xl md:text-3xl font-serif font-semibold mb-0.5 leading-tight"
                style={{ color: stage.textColor, fontFamily: "'Playfair Display', serif" }}
                data-testid="stage-title"
              >
                {stage.title}
              </h1>
              <p
                className="text-xs font-sans uppercase tracking-widest"
                style={{ color: stage.textColor, opacity: 0.45 }}
              >
                {stage.subtitle}
              </p>
            </div>

            <div className="w-8 h-px" style={{ backgroundColor: "#C8A96A" }} />

            <p
              className="font-script text-lg leading-relaxed"
              style={{ color: stage.textColor, opacity: 0.85 }}
              data-testid="stage-belief"
            >
              {stage.belief}
            </p>

            <p
              className="text-sm font-sans leading-relaxed"
              style={{ color: stage.textColor, opacity: 0.65 }}
              data-testid="stage-teaching"
            >
              {stage.teaching}
            </p>

            <div
              className="rounded-xl px-4 py-3 text-xs font-sans leading-relaxed"
              style={{
                backgroundColor: "rgba(200,169,106,0.12)",
                color: stage.textColor,
                opacity: 0.85,
                border: "1px solid rgba(200,169,106,0.2)",
              }}
              data-testid="stage-guidance"
            >
              {stage.guidance}
            </div>

            {/* Show purpose statement from stage 3 onward */}
            {stageIdx >= 3 && context.purposeStatement && (
              <div
                className="rounded-xl px-4 py-4"
                style={{ backgroundColor: "rgba(200,169,106,0.1)", border: "1px solid rgba(200,169,106,0.25)" }}
                data-testid="purpose-display"
              >
                <p className="text-[10px] font-sans uppercase tracking-widest mb-2" style={{ color: stage.textColor, opacity: 0.45 }}>
                  Your Purpose
                </p>
                <p className="font-script text-sm leading-relaxed" style={{ color: stage.textColor }}>
                  {context.purposeStatement}
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={goPrev}
                disabled={stageIdx === 0 || isStreaming}
                className="px-4 py-2 rounded-full text-xs font-sans border transition-all disabled:opacity-30"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: stage.textColor }}
                data-testid="prev-stage-btn"
              >
                ← Back
              </button>
              <button
                onClick={goNext}
                disabled={isStreaming || (stageIdx === 2 && !purposeConfirmed)}
                className="flex-1 px-4 py-2 rounded-full text-xs font-sans font-medium transition-all disabled:opacity-40 hover:opacity-90"
                style={{ backgroundColor: "#C8A96A", color: "#0F2A36" }}
                data-testid="next-stage-btn"
              >
                {stageIdx === STAGES.length - 1 ? "Complete Journey →" : `Continue to ${STAGES[Math.min(stageIdx + 1, STAGES.length - 1)].title} →`}
              </button>
            </div>
          </div>

          {/* Right: Chat + stage-specific UI */}
          <div className="space-y-5">

            {/* Stage 0: prompt selection screen (shown before chat begins) */}
            {stageIdx === 0 && !promptsConfirmed ? (
              <div
                className="rounded-2xl p-6 space-y-5"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,106,0.18)" }}
                data-testid="prompt-selector"
              >
                <div>
                  <p
                    className="text-[10px] font-sans uppercase tracking-widest mb-1"
                    style={{ color: stage.textColor, opacity: 0.45 }}
                  >
                    Choose your stories
                  </p>
                  <p
                    className="text-sm font-sans leading-relaxed"
                    style={{ color: stage.textColor, opacity: 0.75 }}
                  >
                    Pick <strong>2 or 3</strong> of the prompts below. Your guide will walk through each one with you.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" data-testid="prompt-grid">
                  {STORY_PROMPTS.map((prompt) => {
                    const isSelected = selectedPrompts.includes(prompt.id);
                    const atMax = selectedPrompts.length >= 3 && !isSelected;
                    return (
                      <button
                        key={prompt.id}
                        onClick={() => {
                          if (atMax) return;
                          setSelectedPrompts((prev) =>
                            isSelected ? prev.filter((id) => id !== prompt.id) : [...prev, prompt.id]
                          );
                        }}
                        disabled={atMax}
                        className="text-left px-4 py-3.5 rounded-xl border transition-all duration-200"
                        style={{
                          backgroundColor: isSelected
                            ? "rgba(200,169,106,0.18)"
                            : "rgba(255,255,255,0.03)",
                          borderColor: isSelected
                            ? "rgba(200,169,106,0.6)"
                            : "rgba(255,255,255,0.08)",
                          opacity: atMax ? 0.35 : 1,
                        }}
                        data-testid={`prompt-${prompt.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="flex-shrink-0 w-4 h-4 rounded border-2 mt-0.5 flex items-center justify-center transition-all"
                            style={{
                              borderColor: isSelected ? "#C8A96A" : "rgba(200,169,106,0.3)",
                              backgroundColor: isSelected ? "#C8A96A" : "transparent",
                            }}
                          >
                            {isSelected && (
                              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                <path d="M1 3L3 5L7 1" stroke="#0F2A36" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p
                              className="text-sm font-sans font-medium leading-snug mb-1"
                              style={{ color: stage.textColor }}
                            >
                              {prompt.label}
                            </p>
                            <p
                              className="text-xs font-sans leading-relaxed"
                              style={{ color: stage.textColor, opacity: 0.5 }}
                            >
                              {prompt.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p
                    className="text-xs font-sans"
                    style={{ color: stage.textColor, opacity: selectedPrompts.length >= 2 ? 0.6 : 0.35 }}
                  >
                    {selectedPrompts.length === 0
                      ? "Choose at least 2"
                      : selectedPrompts.length === 1
                      ? "Choose 1 more"
                      : `${selectedPrompts.length} selected — ready to begin`}
                  </p>
                  <button
                    onClick={confirmAndBegin}
                    disabled={selectedPrompts.length < 2 || isStreaming}
                    className="px-6 py-2.5 rounded-full text-sm font-sans font-medium transition-all disabled:opacity-30 hover:opacity-90"
                    style={{ backgroundColor: "#C8A96A", color: "#0F2A36" }}
                    data-testid="begin-stories-btn"
                  >
                    {isStreaming ? "Starting..." : "Let's Begin →"}
                  </button>
                </div>
              </div>
            ) : (
              <StageChat
                stage={stage.id}
                messages={allMessages[stageIdx]}
                onMessages={(msgs) => updateStageMessages(stageIdx, msgs)}
                context={buildContext(stageIdx)}
                stageColor={stage.color}
                stageTextColor={stage.textColor}
                cardBg={stage.cardBg}
                placeholder={stage.placeholder}
                journeyId={journeyId!}
                isStreaming={isStreaming}
                setIsStreaming={setIsStreaming}
              />
            )}

            {/* Stage 2 (Pinpoint): Purpose statement picker */}
            {stageIdx === 2 && purposeOptions.length > 0 && (
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,106,0.2)" }}
                data-testid="purpose-picker"
              >
                <div>
                  <p
                    className="text-[10px] font-sans uppercase tracking-widest mb-1"
                    style={{ color: stage.textColor, opacity: 0.45 }}
                  >
                    Your Purpose Statement Options
                  </p>
                  <p
                    className="text-xs font-sans"
                    style={{ color: stage.textColor, opacity: 0.6 }}
                  >
                    Choose one as your starting point, then refine it below.
                  </p>
                </div>

                <div className="space-y-2">
                  {purposeOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedOption(opt);
                        setEditedPurpose(opt);
                        setPurposeConfirmed(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-sans leading-relaxed"
                      style={{
                        backgroundColor:
                          selectedOption === opt
                            ? "rgba(200,169,106,0.18)"
                            : "rgba(255,255,255,0.04)",
                        borderColor:
                          selectedOption === opt
                            ? "rgba(200,169,106,0.6)"
                            : "rgba(200,169,106,0.12)",
                        color: stage.textColor,
                      }}
                      data-testid={`purpose-option-${i}`}
                    >
                      <span style={{ opacity: 0.45 }} className="text-[10px] uppercase tracking-wider block mb-1">
                        Option {i + 1}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>

                <div>
                  <p
                    className="text-[10px] font-sans uppercase tracking-widest mb-2"
                    style={{ color: stage.textColor, opacity: 0.45 }}
                  >
                    Make it yours
                  </p>
                  <textarea
                    className="w-full rounded-xl px-4 py-3 text-sm font-sans leading-relaxed resize-none outline-none"
                    rows={3}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      color: stage.textColor,
                      border: "1px solid rgba(200,169,106,0.25)",
                    }}
                    placeholder="I am someone who _________, so others can _________."
                    value={editedPurpose}
                    onChange={(e) => {
                      setEditedPurpose(e.target.value);
                      setPurposeConfirmed(false);
                    }}
                    data-testid="purpose-editor"
                  />
                </div>

                <button
                  onClick={confirmPurpose}
                  disabled={!editedPurpose.trim()}
                  className="w-full py-3 rounded-full text-sm font-sans font-medium transition-all disabled:opacity-40"
                  style={{ backgroundColor: "#C8A96A", color: "#0F2A36" }}
                  data-testid="confirm-purpose-btn"
                >
                  {purposeConfirmed ? "✓ Purpose Statement Saved" : "Save My Purpose Statement"}
                </button>

                {purposeConfirmed && (
                  <div
                    className="rounded-xl px-4 py-3 text-center"
                    style={{ backgroundColor: "rgba(47,127,123,0.15)", border: "1px solid rgba(47,127,123,0.3)" }}
                    data-testid="confirmed-purpose"
                  >
                    <p className="font-script text-base leading-relaxed" style={{ color: stage.textColor }}>
                      {context.purposeStatement}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneySummary({
  context,
  allMessages,
  onReset,
}: {
  context: JourneyContext;
  allMessages: AllMessages;
  onReset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0F2A36" }}
      data-testid="journey-summary"
    >
      <nav
        className="w-full px-5 py-3 flex items-center justify-between"
        style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
      >
        <Link href="/">
          <img src={rippleLabsLogo} alt="Ripple Labs" className="h-7 w-auto object-contain rounded-md" />
        </Link>
        <Link href="/purpose-lab" className="text-[#D7ECEB] text-xs font-sans opacity-60 hover:opacity-100">
          ← Purpose Lab
        </Link>
      </nav>

      <div className="flex-1 px-6 md:px-12 py-12 max-w-3xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl"
            style={{ backgroundColor: "#C8A96A", color: "#0F2A36" }}>
            ✦
          </div>
          <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-3">
            Journey Complete
          </p>
          <h1
            className="text-3xl md:text-4xl font-serif font-semibold text-white mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Your Purpose Profile
          </h1>
          <div className="w-24 h-px mx-auto" style={{ backgroundColor: "#C8A96A" }} />
        </div>

        <div className="space-y-5">
          {context.purposeStatement && (
            <div
              className="rounded-2xl px-7 py-7"
              style={{ backgroundColor: "rgba(200,169,106,0.1)", border: "1px solid rgba(200,169,106,0.25)" }}
              data-testid="summary-purpose"
            >
              <p className="text-[10px] font-sans uppercase tracking-widest mb-3" style={{ color: "#C8A96A" }}>
                Your Purpose Statement
              </p>
              <p className="font-script text-xl md:text-2xl text-white leading-relaxed">
                {context.purposeStatement}
              </p>
            </div>
          )}

          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const s = STAGES[idx];
            const msgs = allMessages[idx];
            const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
            if (!lastAssistant) return null;
            return (
              <div
                key={idx}
                className="rounded-2xl px-6 py-5"
                style={{ backgroundColor: "rgba(215,236,235,0.05)", border: "1px solid rgba(215,236,235,0.08)" }}
                data-testid={`summary-stage-${idx}`}
              >
                <p className="text-[10px] font-sans uppercase tracking-widest mb-2" style={{ color: "#C8A96A" }}>
                  Stage {s.number} · {s.title} — {s.subtitle}
                </p>
                <p className="text-sm font-sans text-[#D7ECEB] leading-relaxed opacity-75 line-clamp-4">
                  {lastAssistant.content}
                </p>
              </div>
            );
          })}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/purpose-lab"
              className="flex-1 py-3 px-6 rounded-full text-sm font-sans font-medium text-center transition-all hover:opacity-90"
              style={{ backgroundColor: "#2F7F7B", color: "#ffffff" }}
            >
              Return to Purpose Lab
            </Link>
            <button
              onClick={onReset}
              className="flex-1 py-3 px-6 rounded-full text-sm font-sans font-medium border transition-all hover:opacity-80"
              style={{ borderColor: "rgba(200,169,106,0.3)", color: "#C8A96A" }}
              data-testid="start-over-journey"
            >
              Begin a New Journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
