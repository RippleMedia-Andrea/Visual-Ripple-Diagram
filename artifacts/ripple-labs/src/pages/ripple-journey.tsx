import { useState, useEffect, useCallback, useRef } from "react";
import { STORY_PROMPTS } from "@workspace/story-prompts";
import { Link } from "wouter";
import rippleLabsLogo from "@assets/2876A1D3-1596-40F7-9384-F5AAA5F311E8_1777042604510.png";
import { StageChat, type ChatMessage } from "@/components/StageChat";
import { AccountMenu } from "@/components/AccountMenu";
import { StoryCard, PurposeTheme, Season, ActionPlan, JourneyResponse } from "@/lib/types";
import { StoryCardView, ThemeCardView, SeasonFormView, ActionPlanFormView } from "@/components/Discoveries";
import { MyDiscoveries } from "@/components/MyDiscoveries";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

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

type AllMessages = ChatMessage[][];

const emptyMessages = (): AllMessages => STAGES.map(() => []);

export default function RippleJourney() {
  const [journeyId, setJourneyId] = useState<number | null>(null);
  const [isLoadingJourney, setIsLoadingJourney] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [stageIdx, setStageIdx] = useState(0);
  const [highestStageIdx, setHighestStageIdx] = useState(0);
  const [allMessages, setAllMessages] = useState<AllMessages>(emptyMessages);

  const [storyCards, setStoryCards] = useState<StoryCard[]>([]);
  const [themes, setThemes] = useState<PurposeTheme[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [purposeStatement, setPurposeStatement] = useState("");

  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isDiscoveriesOpen, setIsDiscoveriesOpen] = useState(false);

  // Stage 1: prompt selection
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [promptsConfirmed, setPromptsConfirmed] = useState(false);

  // Stage 3: purpose picker UI
  const [purposeOptions, setPurposeOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [editedPurpose, setEditedPurpose] = useState("");
  const [purposeConfirmed, setPurposeConfirmed] = useState(false);

  // Review State
  const [reviewState, setReviewState] = useState({
    isReviewing: false,
    stageId: "",
    isExtracting: false,
    extractionFailed: false,
  });

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
        const pStmt = journey.purposeStatement ?? "";
        setJourneyId(journey.id);
        setStageIdx(journey.currentStageIdx);
        setHighestStageIdx(journey.currentStageIdx);
        setAllMessages(messages);
        setSelectedPrompts(journey.selectedPrompts ?? []);
        setPromptsConfirmed(
          (journey.selectedPrompts?.length ?? 0) >= 2 && messages[0].length > 0,
        );
        setPurposeOptions(journey.purposeOptions ?? []);
        setEditedPurpose(pStmt);
        setPurposeConfirmed(Boolean(pStmt));
        setPurposeStatement(pStmt);

        setStoryCards(journey.storyCards ?? []);
        setThemes(journey.themes ?? []);
        setSeason(journey.season ?? null);
        setActionPlan(journey.actionPlan ?? null);

        if (journey.status === "complete") {
          setIsComplete(true);
        }

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
          purposeStatement: purposeStatement || null,
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
    purposeStatement,
  ]);

  const hasOpened = useRef<Record<number, boolean>>({});

  async function triggerRevealOpening(prompts: string[]) {
    if (allMessages[0].length > 0) return;
    const promptLabels = prompts
      .map((id) => STORY_PROMPTS.find((p) => p.id === id)?.label ?? id)
      .join(", ");
    const openingText = `The person has chosen to share stories around these themes: ${promptLabels}. Please warmly welcome them to Stage 1: Reveal — Your Story. Acknowledge the themes they chose, then gently invite them to begin with whichever one feels most natural right now. Ask one open, warm question to get them started. Keep your opening under 100 words.`;
    await streamAIOpening("reveal", openingText, 0);
  }

  function confirmAndBegin() {
    if (selectedPrompts.length < 2) return;
    setPromptsConfirmed(true);
    triggerRevealOpening(selectedPrompts);
  }

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

  async function streamAIOpening(stageId: string, prompt: string, idx: number) {
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
          context: {}, // Let server build context
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
    streamAIOpening("identify", "I'm ready for Stage 2. Please reflect back the patterns and themes you noticed in my stories, and ask me to confirm or refine them.", 1);
  }

  function triggerPinpointOpening() {
    streamAIOpening("pinpoint", "I'm ready for Stage 3. Based on my confirmed themes and stories, please generate exactly 3 purpose statement options.", 2);
  }

  function triggerPersonalizeOpening() {
    streamAIOpening("personalize", "I'm ready for Stage 4. Please begin by asking about my current season of life and roles.", 3);
  }

  function triggerLiveOpening() {
    streamAIOpening("live", "I'm ready for Stage 5. Please introduce the Start / Stop / Continue framework and ask the first question.", 4);
  }

  function triggerExpandOpening() {
    streamAIOpening("expand", "I've completed all stages. Please begin Stage 6 and guide me into reflection.", 5);
  }

  // Detect purpose options after stage 2 AI responses
  useEffect(() => {
    if (stageIdx === 2) {
      const opts = extractPurposeOptions(allMessages[2]);
      if (opts.length > 0) {
        setPurposeOptions(opts);
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

  function handleContinue() {
    const stageId = stage.id;
    if (["reveal", "identify", "personalize", "live"].includes(stageId)) {
      setReviewState({ isReviewing: true, stageId, isExtracting: true, extractionFailed: false });
      runExtraction(stageId);
    } else {
      goNext();
    }
  }

  async function runExtraction(stageId: string) {
    setReviewState(prev => ({ ...prev, isExtracting: true, extractionFailed: false }));
    try {
      const res = await fetch(`${BASE_URL}/api/journeys/${journeyId}/discoveries/${stageId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Extraction failed");

      const currentRes = await fetch(`${BASE_URL}/api/journeys/current`, { credentials: "include" });
      const journey = await currentRes.json();
      setStoryCards(journey.storyCards ?? []);
      setThemes(journey.themes ?? []);
      setSeason(journey.season ?? null);
      setActionPlan(journey.actionPlan ?? null);

      setReviewState(prev => ({ ...prev, isExtracting: false }));
    } catch {
      setReviewState(prev => ({ ...prev, isExtracting: false, extractionFailed: true }));
    }
  }

  function goPrev() {
    if (reviewState.isReviewing) {
      setReviewState({ isReviewing: false, stageId: "", isExtracting: false, extractionFailed: false });
      return;
    }
    if (stageIdx > 0) setStageIdx((i) => i - 1);
  }

  function confirmPurpose() {
    const stmt = editedPurpose.trim() || selectedOption;
    if (!stmt) return;
    setPurposeStatement(stmt);
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
    setPurposeOptions([]);
    setSelectedOption("");
    setEditedPurpose("");
    setPurposeConfirmed(false);
    setPurposeStatement("");
    setSelectedPrompts([]);
    setPromptsConfirmed(false);
    setIsComplete(false);
    setStoryCards([]);
    setThemes([]);
    setSeason(null);
    setActionPlan(null);
    hasOpened.current = {};
    setReviewState({ isReviewing: false, stageId: "", isExtracting: false, extractionFailed: false });
  }

  // Update Discovery API calls
  async function updateStoryCard(card: StoryCard) {
    setStoryCards(prev => prev.map(c => c.id === card.id ? card : c));
    await fetch(`${BASE_URL}/api/story-cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
      credentials: "include",
    });
  }

  async function deleteStoryCard(id: string) {
    setStoryCards(prev => prev.filter(c => c.id !== id));
    await fetch(`${BASE_URL}/api/story-cards/${id}`, { method: "DELETE", credentials: "include" });
  }

  async function updateTheme(theme: PurposeTheme) {
    setThemes(prev => prev.map(t => t.id === theme.id ? theme : t));
    await fetch(`${BASE_URL}/api/themes/${theme.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(theme),
      credentials: "include",
    });
  }

  async function deleteTheme(id: string) {
    setThemes(prev => prev.filter(t => t.id !== id));
    await fetch(`${BASE_URL}/api/themes/${id}`, { method: "DELETE", credentials: "include" });
  }

  async function updateSeasonApi(s: Season) {
    setSeason(s);
    if (!journeyId) return;
    await fetch(`${BASE_URL}/api/journeys/${journeyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season: s }),
      credentials: "include",
    });
  }

  async function updateActionPlanApi(plan: ActionPlan) {
    setActionPlan(plan);
    if (!journeyId) return;
    await fetch(`${BASE_URL}/api/journeys/${journeyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionPlan: plan }),
      credentials: "include",
    });
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
    return (
      <>
        <MyDiscoveries
          isOpen={isDiscoveriesOpen}
          onClose={() => setIsDiscoveriesOpen(false)}
          storyCards={storyCards}
          themes={themes}
          season={season}
          actionPlan={actionPlan}
          purposeStatement={purposeStatement}
          onUpdateStoryCard={updateStoryCard}
          onDeleteStoryCard={deleteStoryCard}
          onUpdateTheme={updateTheme}
          onDeleteTheme={deleteTheme}
          onUpdateSeason={updateSeasonApi}
          onUpdateActionPlan={updateActionPlanApi}
        />
        <JourneySummary
          storyCards={storyCards}
          themes={themes}
          season={season}
          actionPlan={actionPlan}
          purposeStatement={purposeStatement}
          onReset={resetJourney}
          onOpenDiscoveries={() => setIsDiscoveriesOpen(true)}
        />
      </>
    );
  }

  const progressPct = ((stageIdx + 1) / STAGES.length) * 100;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: stage.color }}
      data-testid="ripple-journey-page"
    >
      <MyDiscoveries
        isOpen={isDiscoveriesOpen}
        onClose={() => setIsDiscoveriesOpen(false)}
        storyCards={storyCards}
        themes={themes}
        season={season}
        actionPlan={actionPlan}
        purposeStatement={purposeStatement}
        onUpdateStoryCard={updateStoryCard}
        onDeleteStoryCard={deleteStoryCard}
        onUpdateTheme={updateTheme}
        onDeleteTheme={deleteTheme}
        onUpdateSeason={updateSeasonApi}
        onUpdateActionPlan={updateActionPlanApi}
      />

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
          <button
            onClick={() => setIsDiscoveriesOpen(true)}
            className="text-xs font-sans opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1.5"
            style={{ color: stage.textColor }}
          >
            <span className="hidden sm:inline">My Discoveries</span>
            <span className="sm:hidden">Discoveries</span>
          </button>
          <span className="hidden sm:inline text-xs font-sans opacity-30" style={{ color: stage.textColor }}>|</span>
          <Link
            href="/purpose-lab"
            className="hidden sm:inline text-xs font-sans opacity-60 hover:opacity-100 transition-opacity"
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
            onClick={() => !isStreaming && !reviewState.isExtracting && i <= highestStageIdx && setStageIdx(i)}
            data-testid={`stage-dot-${s.id}`}
            className="flex items-center gap-1.5 transition-all"
            disabled={isStreaming || reviewState.isExtracting || i > highestStageIdx}
          >
            <div
              className={`rounded-full transition-all duration-300 flex items-center justify-center text-[9px] font-bold ${
                i === stageIdx && !reviewState.isReviewing
                  ? "w-7 h-7 shadow-lg"
                  : i < stageIdx || (i === stageIdx && reviewState.isReviewing)
                  ? "w-5 h-5"
                  : "w-4 h-4 opacity-30"
              }`}
              style={{
                backgroundColor: i <= stageIdx ? "#C8A96A" : "rgba(255,255,255,0.2)",
                color: "#0F2A36",
              }}
            >
              {i < stageIdx || (i === stageIdx && reviewState.isReviewing) ? "✓" : i === stageIdx ? s.number : ""}
            </div>
            {i < STAGES.length - 1 && (
              <div
                className="w-5 md:w-10 h-px"
                style={{
                  backgroundColor: i < stageIdx || (i === stageIdx && reviewState.isReviewing) ? "#C8A96A" : "rgba(255,255,255,0.15)",
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

            {stageIdx >= 3 && purposeStatement && (
              <div
                className="rounded-xl px-4 py-4"
                style={{ backgroundColor: "rgba(200,169,106,0.1)", border: "1px solid rgba(200,169,106,0.25)" }}
                data-testid="purpose-display"
              >
                <p className="text-[10px] font-sans uppercase tracking-widest mb-2" style={{ color: stage.textColor, opacity: 0.45 }}>
                  Your Purpose
                </p>
                <p className="font-script text-sm leading-relaxed" style={{ color: stage.textColor }}>
                  {purposeStatement}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={goPrev}
                disabled={stageIdx === 0 || isStreaming || reviewState.isExtracting}
                className="px-4 py-2 rounded-full text-xs font-sans border transition-all disabled:opacity-30"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: stage.textColor }}
                data-testid="prev-stage-btn"
              >
                ← Back
              </button>
              {!reviewState.isReviewing && (
                <button
                  onClick={stageIdx === 2 || stageIdx === 5 ? goNext : handleContinue}
                  disabled={isStreaming || (stageIdx === 2 && !purposeConfirmed)}
                  className="flex-1 px-4 py-2 rounded-full text-xs font-sans font-medium transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ backgroundColor: "#C8A96A", color: "#0F2A36" }}
                  data-testid="next-stage-btn"
                >
                  {stageIdx === STAGES.length - 1 ? "Complete Journey →" : `Continue to ${STAGES[Math.min(stageIdx + 1, STAGES.length - 1)].title} →`}
                </button>
              )}
            </div>
          </div>

          {/* Right: Chat + stage-specific UI */}
          <div className="space-y-5">
            {reviewState.isReviewing ? (
              <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,106,0.18)" }}>
                {reviewState.isExtracting ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <span className="w-8 h-8 border-2 border-[#C8A96A] border-t-transparent rounded-full animate-spin mb-5" />
                    <p className="text-sm font-sans" style={{ color: stage.textColor }}>Gathering what you shared…</p>
                  </div>
                ) : reviewState.extractionFailed ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm font-sans mb-6" style={{ color: stage.textColor }}>We couldn't gather this right now.</p>
                    <div className="flex gap-4">
                      <button onClick={() => runExtraction(reviewState.stageId)} className="px-5 py-2.5 rounded-full text-xs font-sans border border-[#C8A96A] text-[#C8A96A] hover:bg-[#C8A96A]/10 transition-colors">Try Again</button>
                      <button onClick={() => { setReviewState(prev => ({...prev, isReviewing: false})); goNext(); }} className="px-5 py-2.5 rounded-full text-xs font-sans bg-[#C8A96A] text-[#0F2A36] hover:opacity-90 transition-opacity">Continue Anyway</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <h2 className="font-serif text-3xl mb-2" style={{ color: stage.textColor }}>Here's what I heard</h2>
                      <p className="text-xs font-sans opacity-60" style={{ color: stage.textColor }}>You can change these anytime.</p>
                    </div>

                    <div className="space-y-4 mb-8">
                      {stage.id === "reveal" && storyCards.map(c => <StoryCardView key={c.id} card={c} onUpdate={updateStoryCard} onDelete={() => deleteStoryCard(c.id)} />)}
                      {stage.id === "identify" && themes.map(t => <ThemeCardView key={t.id} theme={t} onUpdate={updateTheme} onDelete={() => deleteTheme(t.id)} />)}
                      {stage.id === "personalize" && season && <SeasonFormView season={season} onUpdate={updateSeasonApi} />}
                      {stage.id === "live" && actionPlan && <ActionPlanFormView actionPlan={actionPlan} onUpdate={updateActionPlanApi} />}
                    </div>

                    <button
                      onClick={() => { setReviewState(prev => ({...prev, isReviewing: false})); goNext(); }}
                      className="w-full py-3.5 rounded-full text-sm font-sans font-medium transition-all hover:opacity-90"
                      style={{ backgroundColor: "#C8A96A", color: "#0F2A36" }}
                    >
                      This feels right — continue →
                    </button>
                  </div>
                )}
              </div>
            ) : stageIdx === 0 && !promptsConfirmed ? (
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
                context={{}} // Server builds context
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
            {!reviewState.isReviewing && stageIdx === 2 && purposeOptions.length > 0 && (
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
                    className="w-full rounded-xl px-4 py-3 text-sm font-sans leading-relaxed resize-none outline-none focus:border-[#C8A96A] transition-colors"
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
                      {purposeStatement}
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
  storyCards,
  themes,
  season,
  actionPlan,
  purposeStatement,
  onReset,
  onOpenDiscoveries,
}: {
  storyCards: StoryCard[];
  themes: PurposeTheme[];
  season: Season | null;
  actionPlan: ActionPlan | null;
  purposeStatement: string | null;
  onReset: () => void;
  onOpenDiscoveries: () => void;
}) {
  const [storiesOpen, setStoriesOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0F2A36" }}
      data-testid="journey-summary"
    >
      <nav
        className="w-full px-5 md:px-10 py-3 flex items-center justify-between sticky top-0 z-50"
        style={{ backgroundColor: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}
      >
        <Link href="/">
          <img src={rippleLabsLogo} alt="Ripple Labs" className="h-7 w-auto object-contain rounded-md cursor-pointer" />
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenDiscoveries}
            className="text-xs font-sans opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[#D7ECEB]"
          >
            <span className="hidden sm:inline">My Discoveries</span>
            <span className="sm:hidden">Discoveries</span>
          </button>
          <span className="hidden sm:inline text-xs font-sans opacity-30 text-[#D7ECEB]">|</span>
          <Link href="/purpose-lab" className="hidden sm:inline text-[#D7ECEB] text-xs font-sans opacity-60 hover:opacity-100">
            ← Purpose Lab
          </Link>
          <AccountMenu color="#D7ECEB" />
        </div>
      </nav>

      <div className="flex-1 px-6 md:px-12 py-12 max-w-3xl mx-auto w-full text-[#D7ECEB]">
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

        <div className="space-y-10">
          {purposeStatement && (
            <div
              className="rounded-2xl px-7 py-10 text-center"
              style={{ backgroundColor: "rgba(200,169,106,0.1)", border: "1px solid rgba(200,169,106,0.25)" }}
              data-testid="summary-purpose"
            >
              <p className="text-[10px] font-sans uppercase tracking-widest mb-6 opacity-80" style={{ color: "#C8A96A" }}>
                Your Purpose Statement
              </p>
              <p className="font-script text-3xl md:text-4xl text-white leading-relaxed max-w-full overflow-hidden break-words mx-auto">
                {purposeStatement}
              </p>
            </div>
          )}

          {themes.length > 0 && (
            <div>
              <p className="text-[10px] font-sans uppercase tracking-widest mb-4 text-center opacity-60">Your Purpose Themes</p>
              <div className="grid gap-4">
                {themes.map(t => (
                  <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6">
                    <h3 className="font-serif text-xl text-[#5FA8A5] mb-2">{t.name}</h3>
                    <p className="text-sm font-sans opacity-80 mb-5">{t.description}</p>
                    {t.evidence && t.evidence.length > 0 && (
                      <div className="border-t border-white/10 pt-4">
                        <p className="text-[10px] uppercase tracking-widest opacity-50 mb-3">Where this showed up</p>
                        <ul className="space-y-3">
                          {t.evidence.map((ev, i) => (
                            <li key={i} className="text-sm flex gap-3 leading-relaxed">
                              <span className="text-[#C8A96A] mt-0.5">✦</span>
                              <span><strong className="font-medium">{ev.storyTitle}:</strong> <span className="opacity-75">{ev.detail}</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {storyCards.length > 0 && (
            <div>
              <button
                onClick={() => setStoriesOpen(!storiesOpen)}
                className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                <span className="text-[10px] font-sans uppercase tracking-widest opacity-80">Your Stories</span>
                <span className="text-xs opacity-50 uppercase tracking-wider">{storiesOpen ? "Hide" : "Show"}</span>
              </button>
              {storiesOpen && (
                <div className="mt-4 grid gap-4">
                  {storyCards.map(c => (
                    <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6">
                      <h3 className="font-serif text-lg text-[#C8A96A] mb-2">{c.title}</h3>
                      <p className="text-sm font-sans opacity-80 leading-relaxed">{c.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {season && (
            <div>
              <p className="text-[10px] font-sans uppercase tracking-widest mb-4 text-center opacity-60">Your Current Season</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
                <p className="text-sm font-sans leading-relaxed opacity-90 mb-6">{season.summary}</p>
                <div className="border-t border-white/10 pt-5">
                  <p className="text-[10px] uppercase tracking-widest opacity-50 mb-3 text-[#5FA8A5]">Ways to live your purpose now</p>
                  <ul className="space-y-3">
                    {season.expressions?.map((exp, i) => (
                      <li key={i} className="text-sm flex gap-3 leading-relaxed">
                        <span className="text-[#C8A96A]">•</span> <span className="opacity-80">{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {actionPlan && (
            <div>
              <p className="text-[10px] font-sans uppercase tracking-widest mb-4 text-center opacity-60">Your Next Steps</p>
              <div className="bg-white/5 border border-[#C8A96A]/30 rounded-xl p-6 md:p-8">
                <div className="grid sm:grid-cols-3 gap-8 mb-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-50 mb-3">Start</p>
                    <ul className="space-y-2">{actionPlan.start?.map((s,i)=><li key={i} className="text-sm opacity-80 leading-snug">- {s}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-50 mb-3">Stop</p>
                    <ul className="space-y-2">{actionPlan.stop?.map((s,i)=><li key={i} className="text-sm opacity-80 leading-snug">- {s}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-50 mb-3">Continue</p>
                    <ul className="space-y-2">{actionPlan.continue?.map((s,i)=><li key={i} className="text-sm opacity-80 leading-snug">- {s}</li>)}</ul>
                  </div>
                </div>
                {actionPlan.oneStepThisWeek && (
                  <div className="bg-[#C8A96A]/10 border border-[#C8A96A]/30 rounded-lg p-5 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-[#C8A96A] mb-2">One Step This Week</p>
                    <p className="text-base font-medium">{actionPlan.oneStepThisWeek}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-16 pb-8 text-center border-t border-white/10 mt-12">
            <p className="font-script text-3xl md:text-4xl text-[#C8A96A] mb-12">What's within you creates a ripple.</p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Link
                href="/purpose-lab"
                className="flex-1 py-3.5 px-6 rounded-full text-sm font-sans font-medium text-center transition-all hover:opacity-90 bg-[#2F7F7B] text-white"
              >
                Return to Purpose Lab
              </Link>
              <button
                onClick={onReset}
                className="flex-1 py-3.5 px-6 rounded-full text-sm font-sans font-medium border transition-all hover:bg-white/5 border-[#C8A96A]/40 text-[#C8A96A]"
              >
                Begin a New Journey
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
