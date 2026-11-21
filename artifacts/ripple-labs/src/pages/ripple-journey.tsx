import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import {
  useGetCurrentJourney,
  getGetCurrentJourneyQueryKey,
  useUpdateJourney,
  useUpdateStoryCard,
  type JourneyUpdate,
} from "@workspace/api-client-react";
import { StoryConfirmCard, RevealSummaries, PatternDiscoveryForm, PatternSummary, PurposePage, PracticePanel } from "@/components/Part4";
import { STORY_PROMPTS } from "@workspace/story-prompts";
import { Link } from "wouter";
import rippleLabsLogo from "@assets/2876A1D3-1596-40F7-9384-F5AAA5F311E8_1777042604510.png";
import { StageChat, type ChatMessage } from "@/components/StageChat";
import { AccountMenu } from "@/components/AccountMenu";
import { StoryCard, PurposeTheme, Season, ActionPlan, JourneyResponse } from "@/lib/types";
import { ThemeCardView, SeasonFormView, ActionPlanFormView } from "@/components/Discoveries";
import { MyDiscoveries } from "@/components/MyDiscoveries";
import { VisionForm } from "@/components/VisionForm";
import type { Vision, PatternDiscovery } from "@/lib/types";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

const STAGES = [
  {
    id: "reveal",
    number: "01",
    title: "Reveal",
    subtitle: "Your Story",
    belief: "Your story holds clues.",
    teaching:
      "Begin with two stories where you felt most like yourself. Notice What I felt, What I did, and What changed.",
    guidance: "Choose a prompt for each story. Your guide listens, reflects back what you felt, did, and what changed, and checks that it sounds right. Two stories minimum; more are welcome.",
    color: "#0B1F4B",
    textColor: "#ffffff",
    cardBg: "rgba(255,255,255,0.06)",
    placeholder: "Start by sharing a moment when you felt most alive, most yourself...",
    openingPrompt: "Let's begin with two stories where you felt most like yourself. For each, we'll notice what you felt, what you did, and what changed. A quiet, ordinary moment counts too.",
  },
  {
    id: "identify",
    number: "02",
    title: "Identify",
    subtitle: "Your Patterns",
    belief: "Patterns reveal purpose.",
    teaching:
      "Find your action word and the impact it has on others. Both carry equal weight and can show up in many roles.",
    guidance: "Your saved summaries come first. Your guide will ask what you notice before offering anything. Then name your action and impact below in your own words.",
    color: "#16306A",
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
      "Put who you are into words. Your purpose statement names your action and the impact it has on others.",
    guidance: "Ask why the impact matters, then go deeper. Use an optional starting point or write your own words.",
    color: "#1E3A6E",
    textColor: "#ffffff",
    cardBg: "rgba(255,255,255,0.08)",
    placeholder: "How does this feel? Which option resonates? Or share what you'd change...",
    openingPrompt: null,
  },
  {
    id: "picture",
    number: "04",
    title: "Picture",
    subtitle: "Your Vision",
    belief: "See the life your purpose makes possible.",
    teaching:
      "See the life your purpose makes possible, and notice whose picture of success you've been borrowing.",
    guidance: "What do you picture? Whose life did that picture come from? What have you been telling yourself you need before you can start?",
    color: "#5A6B8C",
    textColor: "#0B1F4B",
    cardBg: "rgba(11,31,75,0.06)",
    placeholder: "When I imagine living my purpose, I picture...",
    openingPrompt: null,
  },
  {
    id: "live",
    number: "05",
    title: "Live",
    subtitle: "Your Season",
    belief: "Small actions create a life of purpose.",
    teaching:
      "Your season is not the waiting room to your life. Live your purpose right where you are.",
    guidance: "Right now I'm in the season of... The roles I'm carrying... Where is my purpose already showing up?",
    color: "#B9C3D9",
    textColor: "#0B1F4B",
    cardBg: "rgba(11,31,75,0.06)",
    placeholder: "Share what comes to mind...",
    openingPrompt: null,
  },
  {
    id: "expand",
    number: "06",
    title: "Expand",
    subtitle: "Your Ripple",
    belief: "What's within you creates a ripple.",
    teaching:
      "Your ripple reaches the people around you and keeps growing.",
    guidance: "Reflect on what you're taking away. Your guide will help you close this season of the journey.",
    color: "#EEE9DB",
    textColor: "#0B1F4B",
    cardBg: "rgba(11,31,75,0.05)",
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

  const regex = /Option\s*\d[:.)]?\s*["“]?([^\n"”]+)["”]?/gi;
  let match;
  while ((match = regex.exec(allText)) !== null) {
    const stmt = match[1].trim().replace(/["""]/g, "");
    if (stmt && !options.includes(stmt)) options.push(stmt);
  }

  if (options.length === 0) {
    const lineRegex = /["“]?((?:I wake up each day to|I am someone who)[^"”\n]{10,})["”]?/gi;
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
  const [practice, setPractice] = useState(false);
  return <JourneyInner key={practice ? "practice" : "personal"} practice={practice} onTogglePractice={() => setPractice((p) => !p)} />;
}

function JourneyInner({ practice, onTogglePractice }: { practice: boolean; onTogglePractice: () => void }) {
  const journeyParams = { practice };
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const journeyKey = [...getGetCurrentJourneyQueryKey(journeyParams), session?.user.id];
  const journeyQuery = useGetCurrentJourney(journeyParams, {
    query: { queryKey: journeyKey, enabled: Boolean(session?.user.id), refetchOnWindowFocus: false, staleTime: 10000 },
  });
  const updateJourneyMutation = useUpdateJourney({ mutation: { onSuccess: (record, variables) => {
    queryClient.setQueryData<JourneyResponse>(journeyKey, previous => previous ? {
      ...previous,
      ...variables.data,
      // A slower response to an older draft must not undo a newer optimistic edit.
      drafts: { ...record.drafts, ...previous.drafts },
    } as JourneyResponse : previous);
  } } });
  const updateStoryCardMutation = useUpdateStoryCard();
  const updateJourneyRef = useRef(updateJourneyMutation.mutateAsync);
  updateJourneyRef.current = updateJourneyMutation.mutateAsync;
  const [journeyId, setJourneyId] = useState<number | null>(null);
  const [isLoadingJourney, setIsLoadingJourney] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [patternDiscovery, setPatternDiscovery] = useState<PatternDiscovery | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [seed, setSeed] = useState<{ text: string; nonce: number } | null>(null);
  const [showPurposePage, setShowPurposePage] = useState(false);
  const [readAloudChecked, setReadAloudChecked] = useState(false);
  const [purposeSaveError, setPurposeSaveError] = useState("");
  const draftQueue = useRef<Promise<unknown>>(Promise.resolve());
  const failedDrafts = useRef<Record<string, string>>({});
  const [draftError, setDraftError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [highestStageIdx, setHighestStageIdx] = useState(0);
  const [allMessages, setAllMessages] = useState<AllMessages>(emptyMessages);

  const [storyCards, setStoryCards] = useState<StoryCard[]>([]);
  const [themes, setThemes] = useState<PurposeTheme[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [vision, setVision] = useState<Vision | null>(null);
  const [legacySeasonMessages, setLegacySeasonMessages] = useState<ChatMessage[]>([]);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [purposeStatement, setPurposeStatement] = useState("");

  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecordingBusy, setIsRecordingBusy] = useState(false);
  const [openingError, setOpeningError] = useState("");
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
  const [actionChecked, setActionChecked] = useState(false);
  const [impactChecked, setImpactChecked] = useState(false);

  // Review State
  const [reviewState, setReviewState] = useState({
    isReviewing: false,
    stageId: "",
    isExtracting: false,
    extractionFailed: false,
  });

  const stage = STAGES[stageIdx];

  const initializedRef = useRef(false);
  useEffect(() => {
    if (journeyQuery.isError && !initializedRef.current) {
      setLoadError("Unable to load your journey.");
      setIsLoadingJourney(false);
      return;
    }
    const raw = journeyQuery.data;
    if (!raw || initializedRef.current) return;
    initializedRef.current = true;
    setLoadError("");
    const journey = raw as unknown as JourneyResponse;
    const messages = STAGES.map((item) => (journey.messages[item.id] ?? []) as ChatMessage[]);
    const pStmt = journey.purposeStatement ?? "";
    setJourneyId(journey.id);
    setStageIdx(journey.currentStageIdx);
    setHighestStageIdx(journey.currentStageIdx);
    setAllMessages(messages);
    setSelectedPrompts(journey.selectedPrompts ?? []);
    setPromptsConfirmed(messages[0].length > 0);
    setLegacySeasonMessages((journey.messages.personalize ?? []) as ChatMessage[]);
    setPurposeOptions(journey.purposeOptions ?? []);
    setEditedPurpose(pStmt);
    setPurposeConfirmed(Boolean(pStmt));
    setPurposeStatement(pStmt);
    setStoryCards(journey.storyCards ?? []);
    setThemes(journey.themes ?? []);
    setSeason(journey.season ?? null);
    setVision(journey.vision ?? null);
    setActionPlan(journey.actionPlan ?? null);
    setPatternDiscovery(journey.patternDiscovery ?? null);
    setDrafts(journey.drafts ?? {});
    if (journey.status === "complete") setIsComplete(true);
    setIsLoadingJourney(false);
  }, [journeyQuery.data, journeyQuery.isError]);

  function saveDrafts(patch: Record<string, string>) {
    if (!journeyId) return;
    const id = journeyId;
    // serialize so a cleared draft is never overtaken by an older in-flight save
    setDrafts((d) => ({ ...d, ...patch }));
    queryClient.setQueryData<JourneyResponse>(journeyKey, previous => previous ? { ...previous, drafts: { ...previous.drafts, ...patch } } : previous);
    draftQueue.current = draftQueue.current
      .catch(() => undefined)
      .then(async () => {
        // newer values supersede any earlier failed ones for the same key
        for (const k of Object.keys(patch)) delete failedDrafts.current[k];
        try {
          await updateJourneyRef.current({ id, data: { drafts: patch } });
          if (!Object.keys(failedDrafts.current).length) setDraftError("");
        } catch {
          failedDrafts.current = { ...failedDrafts.current, ...patch };
          setDraftError("Your latest draft hasn't saved yet. It's still here on this screen.");
        }
      });
  }

  function retryDrafts() {
    const p = failedDrafts.current;
    failedDrafts.current = {};
    if (Object.keys(p).length) saveDrafts(p);
    else setDraftError("");
  }

  async function refreshJourney() {
    const result = await journeyQuery.refetch();
    const journey = result.data as unknown as JourneyResponse | undefined;
    if (!journey) throw new Error("Unable to refresh your journey.");
    setStoryCards(journey.storyCards ?? []);
    setThemes(journey.themes ?? []);
    setSeason(journey.season ?? null);
    setVision(journey.vision ?? null);
    setActionPlan(journey.actionPlan ?? null);
    setPatternDiscovery(journey.patternDiscovery ?? null);
    return journey;
  }

  useEffect(() => {
    if (!journeyId || isLoadingJourney) return;
    const timeout = window.setTimeout(() => {
      // only fields owned by this autosave; stage, status and statement are saved explicitly
      updateJourneyRef.current({ id: journeyId, data: { selectedPrompts, purposeOptions } })
        .then(() => setSaveError(""))
        .catch(() => setSaveError("Your prompt choices didn't save. Check your connection; they'll save on the next change."));
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [journeyId, isLoadingJourney, selectedPrompts, purposeOptions]);

  const hasOpened = useRef<Record<number, boolean>>({});

  async function triggerRevealOpening(prompts: string[]) {
    if (allMessages[0].length > 0) return;
    const promptLabels = prompts
      .map((id) => STORY_PROMPTS.find((p) => p.id === id)?.label ?? id)
      .join(", ");
    const openingText = `Welcome me to Reveal, Your Story. I chose this prompt for my first story: ${promptLabels || "a time I felt most like myself"}. Invite me to tell it my own way, one question at a time. Afterwards reflect back What you felt, What you did, and What changed, using my words, and ask if it sounds right. Do not name patterns or purpose yet.`;
    await streamAIOpening("reveal", openingText, 0);
  }

  function confirmAndBegin() {
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
      triggerPictureOpening();
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
    setOpeningError("");
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
      let pending = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pending += dec.decode(value, { stream: true });
        const lines = pending.split("\n");
        pending = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let d;
          try {
            d = JSON.parse(line.slice(6));
          } catch { continue; }
            if (d.error) throw new Error("Your guide is unavailable right now.");
            if (d.content) text += d.content;
            if (d.done) {
              setAllMessages((prev) => {
                const next = [...prev];
                next[idx] = [{ role: "assistant", content: text }];
                return next;
              });
              setIsStreaming(false);
            }
        }
      }
      if (!text) throw new Error("Your guide is unavailable right now.");
      setAllMessages((prev) => {
        const next = [...prev];
        next[idx] = [{ role: "assistant", content: text }];
        return next;
      });
    } catch {
      setOpeningError("Your guide couldn't start. Please try sharing your reflection below.");
    } finally {
      setIsStreaming(false);
    }
  }

  function triggerIdentifyOpening() {
    streamAIOpening("identify", "I'm ready for Identify. My Reveal summaries are saved and shown on screen. Before offering any observations of your own, ask me what I notice repeating across my stories, especially what I do and the impact on others.", 1);
  }

  function triggerPinpointOpening() {
    streamAIOpening("pinpoint", "I'm ready for Pinpoint. Show me my action and impact from Identify. Offer the optional form I wake up each day to [action] so that [impact], and make clear my own words are welcome. Help me draft, then ask why the impact matters more than once until it reaches the real change in someone else's life. Encourage plain everyday words. When I have a draft, invite me to read it out loud and ask if it feels true, not impressive, just true.", 2);
  }

  function triggerPictureOpening() {
    streamAIOpening("picture", "I'm ready for Picture. When I imagine living my purpose, what do I picture? Please help me explore this, one question at a time.", 3);
  }

  function triggerLiveOpening() {
    streamAIOpening("live", "I'm ready for Live, Your Season. Begin with Right now I'm in the season of... Then explore my roles and where purpose is already showing up before practical next steps.", 4);
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

  async function goNext() {
    if (isRecordingBusy) return false;
    if (!journeyId || isAdvancing) return false;
    setSaveError("");
    setIsAdvancing(true);
    const finishing = stageIdx >= STAGES.length - 1;
    const next = finishing ? 5 : stageIdx + 1;
    const data: JourneyUpdate = finishing
      ? { status: "complete", currentStageIdx: 5 }
      : { currentStageIdx: Math.max(highestStageIdx, next), selectedPrompts };
    try {
      await updateJourneyMutation.mutateAsync({ id: journeyId, data });
      if (finishing) {
        setIsComplete(true);
      } else {
        setHighestStageIdx((current) => Math.max(current, next));
        setStageIdx(next);
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : "";
      setSaveError(`We couldn't move you forward yet${msg ? ` (${msg})` : ""}. Nothing was lost. Please try again.`);
      return false;
    } finally {
      setIsAdvancing(false);
    }
  }

  function handleContinue() {
    if (isRecordingBusy) return;
    const stageId = stage.id;
    if (["reveal", "identify", "picture", "live"].includes(stageId)) {
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

      await refreshJourney();

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

  async function confirmPurpose() {
    const stmt = editedPurpose.trim() || selectedOption;
    if (!stmt || !actionChecked || !impactChecked || !readAloudChecked) return;
    setPurposeSaveError("");
    try {
      await savePurposeStatementNow(stmt);
      setPurposeStatement(stmt);
      setPurposeConfirmed(true);
    } catch {
      setPurposeSaveError("Your statement didn't save. Please try again.");
    }
  }

  async function saveVision(next: Vision) {
    const response = await fetch(`${BASE_URL}/api/journeys/${journeyId}`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vision: next }),
    });
    if (!response.ok) throw new Error("Unable to save vision.");
    setVision(next);
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
    setVision(null);
    setLegacySeasonMessages([]);
    setActionChecked(false);
    setImpactChecked(false);
    setActionPlan(null);
    hasOpened.current = {};
    setReviewState({ isReviewing: false, stageId: "", isExtracting: false, extractionFailed: false });
  }

  // Update Discovery API calls
  async function updateStoryCard(card: StoryCard) {
    const saved = await updateStoryCardMutation.mutateAsync({
      id: Number(card.id),
      data: {
        title: card.title,
        summary: card.summary,
        actions: card.actions,
        feelings: card.feelings,
        people: card.people,
        impact: card.impact,
        confirmed: Boolean(card.confirmed),
      },
    });
    const merged = { ...card, ...(saved as unknown as Partial<StoryCard>), id: card.id };
    setStoryCards(prev => prev.map(c => c.id === card.id ? merged : c));
  }

  async function deleteStoryCard(id: string) {
    setStoryCards(prev => prev.filter(c => c.id !== id));
    await fetch(`${BASE_URL}/api/story-cards/${id}`, { method: "DELETE", credentials: "include" });
  }

  async function savePatternDiscovery(next: PatternDiscovery) {
    if (!journeyId) throw new Error("No journey");
    await updateJourneyMutation.mutateAsync({ id: journeyId, data: { patternDiscovery: next } });
    setPatternDiscovery(next);
  }

  async function savePurposeStatementNow(stmt: string) {
    if (!journeyId) return;
    const data: JourneyUpdate = { purposeStatement: stmt, purposeOptions };
    await updateJourneyMutation.mutateAsync({ id: journeyId, data });
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
      <div className="min-h-screen bg-[#0B1F4B] text-[#EDE4CC] flex flex-col items-center justify-center gap-4 font-sans" data-testid="status-loading-journey">
        <div className="w-40 h-2 rounded-full bg-white/10 animate-pulse" />
        <div className="w-24 h-2 rounded-full bg-white/10 animate-pulse" />
        <p className="text-xs opacity-60">{practice ? "Opening your practice notebook" : "Opening your journey"}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0B1F4B] text-[#EDE4CC] flex items-center justify-center px-6 font-sans text-center">
        <div>
          <p>{loadError}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-5 py-2 rounded-full bg-[#C9A84C] text-[#0B1F4B] text-sm" data-testid="button-retry-load">Try again</button>
          {practice && <button onClick={onTogglePractice} className="mt-4 ml-3 px-5 py-2 rounded-full border border-[#C9A84C] text-sm" data-testid="button-exit-practice-error">Back to my journey</button>}
        </div>
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
          vision={vision}
          onUpdateVision={saveVision}
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
          onOpenPurposePage={() => setShowPurposePage(true)}
        />
        {showPurposePage && purposeStatement && <PurposePage statement={purposeStatement} pattern={patternDiscovery} onClose={() => setShowPurposePage(false)} />}
      {(draftError || saveError) && (
        <div role="alert" className="flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-xs font-sans" style={{ backgroundColor: "#F5F1E8", color: "#7a3b2e" }} data-testid="banner-save-error">
          <span>{saveError || draftError}</span>
          {draftError && !saveError && <button onClick={retryDrafts} className="underline" data-testid="button-retry-drafts">Save again</button>}
          {saveError && <button onClick={() => setSaveError("")} className="underline" data-testid="button-dismiss-save-error">Dismiss</button>}
        </div>
      )}
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
        vision={vision}
        onUpdateVision={saveVision}
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
          <button
            onClick={onTogglePractice}
            disabled={isStreaming || isRecordingBusy}
            className="text-[11px] font-sans px-3 py-1 rounded-full border transition-colors disabled:opacity-40"
            style={{ color: stage.textColor, borderColor: practice ? "#C9A84C" : "rgba(201,168,76,0.35)", backgroundColor: practice ? "rgba(201,168,76,0.25)" : "transparent" }}
            aria-pressed={practice}
            data-testid="button-toggle-practice"
          >
            {practice ? "Practice on · back to mine" : "Practice"}
          </button>
          <AccountMenu color={stage.textColor} />
        </div>
      </nav>
      {practice && (
        <div className="text-center text-[11px] font-sans py-1.5 tracking-wide" style={{ backgroundColor: "#C9A84C", color: "#0B1F4B" }} data-testid="banner-practice">
          Practice notebook. Separate from your own journey, and every stage is open.
        </div>
      )}
      {showPurposePage && purposeStatement && <PurposePage statement={purposeStatement} pattern={patternDiscovery} onClose={() => setShowPurposePage(false)} />}

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${progressPct}%`, backgroundColor: "#C9A84C" }}
          data-testid="progress-bar"
        />
      </div>

      {/* Stage dots */}
      <div className="flex items-center justify-center gap-2 pt-4 px-5">
        {STAGES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              if (isStreaming || isRecordingBusy || reviewState.isExtracting) return;
              if (practice) { setHighestStageIdx((h) => Math.max(h, i)); setStageIdx(i); return; }
              if (i <= highestStageIdx) setStageIdx(i);
            }}
            data-testid={`stage-dot-${s.id}`}
            className="flex items-center gap-1.5 transition-all"
            disabled={isStreaming || isRecordingBusy || reviewState.isExtracting || (!practice && i > highestStageIdx)}
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
                backgroundColor: i <= stageIdx ? "#C9A84C" : "rgba(255,255,255,0.2)",
                color: "#0B1F4B",
              }}
            >
              {i < stageIdx || (i === stageIdx && reviewState.isReviewing) ? "✓" : i === stageIdx ? s.number : ""}
            </div>
            {i < STAGES.length - 1 && (
              <div
                className="w-5 md:w-10 h-px"
                style={{
                  backgroundColor: i < stageIdx || (i === stageIdx && reviewState.isReviewing) ? "#C9A84C" : "rgba(255,255,255,0.15)",
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

            <div className="w-8 h-px" style={{ backgroundColor: "#C9A84C" }} />

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
                backgroundColor: "rgba(201,168,76,0.12)",
                color: stage.textColor,
                opacity: 0.85,
                border: "1px solid rgba(201,168,76,0.2)",
              }}
              data-testid="stage-guidance"
            >
              {stage.guidance}
            </div>

            {stageIdx >= 3 && purposeStatement && (
              <div
                className="rounded-xl px-4 py-4"
                style={{ backgroundColor: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)" }}
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
            {stageIdx === 5 && <p className="text-xs" style={{ color: stage.textColor }}>Expand exercise retained for your review.</p>}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={goPrev}
                disabled={stageIdx === 0 || isStreaming || isRecordingBusy || reviewState.isExtracting}
                className="px-4 py-2 rounded-full text-xs font-sans border transition-all disabled:opacity-30"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: stage.textColor }}
                data-testid="prev-stage-btn"
              >
                ← Back
              </button>
              {!reviewState.isReviewing && (
                <button
                  onClick={stageIdx === 2 || stageIdx === 5 ? goNext : handleContinue}
                  disabled={isStreaming || isRecordingBusy || isAdvancing || (!practice && stageIdx === 1 && !patternDiscovery?.confirmed) || (!practice && stageIdx === 2 && !purposeConfirmed)}
                  className="flex-1 px-4 py-2 rounded-full text-xs font-sans font-medium transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ backgroundColor: "#C9A84C", color: "#0B1F4B" }}
                  data-testid="next-stage-btn"
                >
                  {stageIdx === STAGES.length - 1 ? "Complete Journey →" : `Continue to ${STAGES[Math.min(stageIdx + 1, STAGES.length - 1)].title} →`}
                </button>
              )}
            </div>
            {!practice && stageIdx === 1 && !patternDiscovery?.confirmed && !reviewState.isReviewing && (
              <p className="text-[11px] font-sans opacity-60" style={{ color: stage.textColor }} data-testid="text-identify-gate">Confirm your action and impact to continue.</p>
            )}
          </div>

          {/* Right: Chat + stage-specific UI */}
          <div className="space-y-5">
            {openingError && <p role="alert" className="text-sm font-sans px-4 py-3">{openingError}</p>}
            {stageIdx === 3 && vision && !reviewState.isReviewing && <VisionForm vision={vision} onSave={saveVision} />}
            {stageIdx === 4 && legacySeasonMessages.length > 0 && <details className="rounded-xl bg-white/70 p-4 text-[#0B1F4B]">
              <summary>Earlier season reflection</summary>
              <p className="text-sm my-2">Saved from the earlier version of the journey. Your original words are preserved.</p>
              {legacySeasonMessages.map((message, i) => <p key={i} className="text-sm my-2"><strong>{message.role === "user" ? "You" : "Guide"}:</strong> {message.content}</p>)}
            </details>}
            {reviewState.isReviewing ? (
              <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.18)" }}>
                {reviewState.isExtracting ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <span className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mb-5" />
                    <p className="text-sm font-sans" style={{ color: stage.textColor }}>Gathering what you shared…</p>
                  </div>
                ) : reviewState.extractionFailed ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm font-sans mb-6" style={{ color: stage.textColor }}>We couldn't gather this right now.</p>
                    <div className="flex gap-4">
                      <button onClick={() => runExtraction(reviewState.stageId)} className="px-5 py-2.5 rounded-full text-xs font-sans border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors">Try Again</button>
                      {["reveal", "identify"].includes(reviewState.stageId) ? (
                        <button onClick={() => setReviewState({ isReviewing: false, stageId: "", isExtracting: false, extractionFailed: false })} className="px-5 py-2.5 rounded-full text-xs font-sans bg-[#C9A84C] text-[#0B1F4B]" data-testid="button-back-to-conversation">Back to the conversation</button>
                      ) : (
                        <button onClick={() => { setReviewState(prev => ({...prev, isReviewing: false})); goNext(); }} className="px-5 py-2.5 rounded-full text-xs font-sans bg-[#C9A84C] text-[#0B1F4B] hover:opacity-90 transition-opacity">Continue Anyway</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <h2 className="font-serif text-3xl mb-2" style={{ color: stage.textColor }}>Here's what I heard</h2>
                      <p className="text-xs font-sans opacity-60" style={{ color: stage.textColor }}>You can change these anytime.</p>
                    </div>

                    <div className="space-y-4 mb-8">
                      {stage.id === "reveal" && storyCards.length === 0 && <p className="text-sm font-sans opacity-70" style={{ color: stage.textColor }}>No stories were gathered yet. Return to the conversation and share a story first.</p>}
                      {stage.id === "reveal" && storyCards.map((c, i) => <StoryConfirmCard key={c.id} card={c} index={i} textColor={stage.textColor} onSave={updateStoryCard} onDelete={() => deleteStoryCard(c.id)} />)}
                      {stage.id === "identify" && <PatternSummary value={patternDiscovery} textColor={stage.textColor} />}
                      {stage.id === "identify" && themes.map(t => <ThemeCardView key={t.id} theme={t} onUpdate={updateTheme} onDelete={() => deleteTheme(t.id)} />)}
                      {stage.id === "picture" && vision && <VisionForm vision={vision} onSave={saveVision} />}
                      {stage.id === "live" && season && <SeasonFormView season={season} onUpdate={updateSeasonApi} />}
                      {stage.id === "live" && actionPlan && <ActionPlanFormView actionPlan={actionPlan} onUpdate={updateActionPlanApi} />}
                    </div>

                    {stage.id === "reveal" && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                        <p className="text-xs font-sans flex-1" style={{ color: stage.textColor, opacity: 0.7 }} data-testid="text-confirmed-count">
                          {storyCards.filter((c) => c.confirmed).length} of {Math.max(2, storyCards.length)} confirmed. Confirm at least two stories to continue. Copy these into your notebook too.
                        </p>
                        <button onClick={() => setReviewState({ isReviewing: false, stageId: "", isExtracting: false, extractionFailed: false })} className="px-4 py-2 rounded-full text-xs font-sans border" style={{ borderColor: "rgba(201,168,76,0.5)", color: stage.textColor }} data-testid="button-tell-another-story">
                          Tell another story
                        </button>
                      </div>
                    )}
                    <button
                      onClick={async () => { if (await goNext()) setReviewState(prev => ({...prev, isReviewing: false})); }}
                      disabled={!practice && ((stage.id === "reveal" && storyCards.filter((c) => c.confirmed).length < 2) || (stage.id === "identify" && !patternDiscovery?.confirmed))}
                      className="w-full py-3.5 rounded-full text-sm font-sans font-medium transition-all hover:opacity-90 disabled:opacity-40"
                      style={{ backgroundColor: "#C9A84C", color: "#0B1F4B" }}
                      data-testid="button-review-continue"
                    >
                      This feels right. Continue →
                    </button>
                  </div>
                )}
              </div>
            ) : stageIdx === 0 && !promptsConfirmed ? (
              <div
                className="rounded-2xl p-6 space-y-5"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.18)" }}
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
                    Choose a prompt to start your first story. Pick a time you felt most like yourself. You'll choose a different prompt for your second story.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" data-testid="prompt-grid">
                  {STORY_PROMPTS.map((prompt) => {
                    const isSelected = selectedPrompts[0] === prompt.id;
                    const atMax = false;
                    return (
                      <button
                        key={prompt.id}
                        onClick={() => {
                          if (atMax) return;
                          setSelectedPrompts(isSelected ? [] : [prompt.id]);
                        }}
                        disabled={atMax}
                        className="text-left px-4 py-3.5 rounded-xl border transition-all duration-200"
                        style={{
                          backgroundColor: isSelected
                            ? "rgba(201,168,76,0.18)"
                            : "rgba(255,255,255,0.03)",
                          borderColor: isSelected
                            ? "rgba(201,168,76,0.6)"
                            : "rgba(255,255,255,0.08)",
                          opacity: atMax ? 0.35 : 1,
                        }}
                        data-testid={`prompt-${prompt.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="flex-shrink-0 w-4 h-4 rounded border-2 mt-0.5 flex items-center justify-center transition-all"
                            style={{
                              borderColor: isSelected ? "#C9A84C" : "rgba(201,168,76,0.3)",
                              backgroundColor: isSelected ? "#C9A84C" : "transparent",
                            }}
                          >
                            {isSelected && (
                              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                <path d="M1 3L3 5L7 1" stroke="#0B1F4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                    {selectedPrompts.length === 0 ? "Choose one prompt to begin" : "Ready when you are"}
                  </p>
                  <button
                    onClick={confirmAndBegin}
                    disabled={isStreaming || selectedPrompts.length === 0}
                    className="px-6 py-2.5 rounded-full text-sm font-sans font-medium transition-all disabled:opacity-30 hover:opacity-90"
                    style={{ backgroundColor: "#C9A84C", color: "#0B1F4B" }}
                    data-testid="begin-stories-btn"
                  >
                    {isStreaming ? "Starting..." : "Let's Begin →"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              {practice && <PracticePanel textColor={stage.textColor} onUseSample={(text) => setSeed({ text, nonce: Date.now() })} />}
              {stageIdx === 1 && <RevealSummaries cards={storyCards} textColor={stage.textColor} />}
              {stageIdx === 2 && <PatternSummary value={patternDiscovery} textColor={stage.textColor} />}
              {stageIdx === 0 && (
                <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)" }} data-testid="next-story-prompts">
                  <p className="text-[10px] font-sans uppercase tracking-widest mb-2.5" style={{ color: stage.textColor, opacity: 0.5 }}>
                    Ready for another story? Choose a different prompt
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STORY_PROMPTS.map((p) => {
                      const used = selectedPrompts.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          disabled={isStreaming}
                          onClick={() => {
                            if (!used) setSelectedPrompts((prev) => [...prev, p.id]);
                            setSeed({ text: `For my next story I chose: ${p.label}. `, nonce: Date.now() });
                          }}
                          className="px-3 py-1.5 rounded-full text-xs font-sans border transition-colors disabled:opacity-40"
                          style={{ color: stage.textColor, borderColor: used ? "rgba(201,168,76,0.7)" : "rgba(255,255,255,0.15)", backgroundColor: used ? "rgba(201,168,76,0.14)" : "transparent" }}
                          data-testid={`button-next-prompt-${p.id}`}
                        >
                          {used ? "Used: " : ""}{p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <StageChat
                key={`${journeyId}-${stage.id}`}
                initialDraft={drafts[stage.id] ?? ""}
                initialTranscript={drafts[`${stage.id}__transcript`] ?? ""}
                onSaveDrafts={saveDrafts}
                seed={seed}
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
                onRecordingBusy={setIsRecordingBusy}
              />
              {stageIdx === 1 && <PatternDiscoveryForm key={journeyId ?? 0} value={patternDiscovery} textColor={stage.textColor} onSave={savePatternDiscovery} />}
              </div>
            )}

            {/* Stage 2 (Pinpoint): Purpose statement picker */}
            {!reviewState.isReviewing && stageIdx === 2 && (
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}
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
                    Optional starting points. The form is optional; your own words are welcome.
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
                        setActionChecked(false);
                        setImpactChecked(false);
                        setReadAloudChecked(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-sans leading-relaxed"
                      style={{
                        backgroundColor:
                          selectedOption === opt
                            ? "rgba(201,168,76,0.18)"
                            : "rgba(255,255,255,0.04)",
                        borderColor:
                          selectedOption === opt
                            ? "rgba(201,168,76,0.6)"
                            : "rgba(201,168,76,0.12)",
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
                    className="w-full rounded-xl px-4 py-3 text-sm font-sans leading-relaxed resize-none outline-none focus:border-[#C9A84C] transition-colors"
                    rows={3}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      color: stage.textColor,
                      border: "1px solid rgba(201,168,76,0.25)",
                    }}
                    placeholder="I wake up each day to [action] so that [impact]. Or use your own words."
                    value={editedPurpose}
                    onChange={(e) => {
                      setEditedPurpose(e.target.value);
                      setActionChecked(false);
                      setImpactChecked(false);
                      setReadAloudChecked(false);
                      setPurposeConfirmed(false);
                    }}
                    data-testid="purpose-editor"
                  />
                </div>
                <p className="text-sm" style={{ color: stage.textColor }}>The form is optional. Include both your action and an outward impact.</p>
                <label className="block text-sm" style={{ color: stage.textColor }}><input type="checkbox" checked={actionChecked} onChange={(e) => setActionChecked(e.target.checked)} /> My statement names my action.</label>
                <label className="block text-sm" style={{ color: stage.textColor }}><input type="checkbox" checked={impactChecked} onChange={(e) => setImpactChecked(e.target.checked)} /> My statement names the impact on others.</label>
                <label className="block text-sm" style={{ color: stage.textColor }}><input type="checkbox" checked={readAloudChecked} onChange={(e) => setReadAloudChecked(e.target.checked)} data-testid="checkbox-read-aloud" /> I read it out loud. It feels true. Not impressive, just true.</label>
                {purposeSaveError && <p role="alert" className="text-xs" style={{ color: stage.textColor }}>{purposeSaveError}</p>}

                <button
                  onClick={confirmPurpose}
                  disabled={!editedPurpose.trim() || !actionChecked || !impactChecked || !readAloudChecked || updateJourneyMutation.isPending}
                  className="w-full py-3 rounded-full text-sm font-sans font-medium transition-all disabled:opacity-40"
                  style={{ backgroundColor: "#C9A84C", color: "#0B1F4B" }}
                  data-testid="confirm-purpose-btn"
                >
                  {purposeConfirmed ? "✓ Purpose Statement Saved" : "Save My Purpose Statement"}
                </button>

                {purposeConfirmed && (
                  <div
                    className="rounded-xl px-4 py-3 text-center"
                    style={{ backgroundColor: "rgba(11,31,75,0.15)", border: "1px solid rgba(11,31,75,0.3)" }}
                    data-testid="confirmed-purpose"
                  >
                    <p className="font-script text-base leading-relaxed" style={{ color: stage.textColor }}>
                      {purposeStatement}
                    </p>
                    <button onClick={() => setShowPurposePage(true)} className="mt-3 text-xs font-sans underline" style={{ color: stage.textColor }} data-testid="button-open-purpose-page">
                      Open my purpose page to download or screenshot
                    </button>
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
  onOpenPurposePage,
}: {
  storyCards: StoryCard[];
  themes: PurposeTheme[];
  season: Season | null;
  actionPlan: ActionPlan | null;
  purposeStatement: string | null;
  onReset: () => void;
  onOpenDiscoveries: () => void;
  onOpenPurposePage: () => void;
}) {
  const [storiesOpen, setStoriesOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0B1F4B" }}
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
            className="text-xs font-sans opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[#EDE4CC]"
          >
            <span className="hidden sm:inline">My Discoveries</span>
            <span className="sm:hidden">Discoveries</span>
          </button>
          <span className="hidden sm:inline text-xs font-sans opacity-30 text-[#EDE4CC]">|</span>
          <Link href="/purpose-lab" className="hidden sm:inline text-[#EDE4CC] text-xs font-sans opacity-60 hover:opacity-100">
            ← Purpose Lab
          </Link>
          <AccountMenu color="#EDE4CC" />
        </div>
      </nav>

      <div className="flex-1 px-6 md:px-12 py-12 max-w-3xl mx-auto w-full text-[#EDE4CC]">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl"
            style={{ backgroundColor: "#C9A84C", color: "#0B1F4B" }}>
            ✦
          </div>
          <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-3">
            Journey Complete
          </p>
          <h1
            className="text-3xl md:text-4xl font-serif font-semibold text-white mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Your Purpose Profile
          </h1>
          <div className="w-24 h-px mx-auto" style={{ backgroundColor: "#C9A84C" }} />
        </div>

        <div className="space-y-10">
          {purposeStatement && (
            <div
              className="rounded-2xl px-7 py-10 text-center"
              style={{ backgroundColor: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)" }}
              data-testid="summary-purpose"
            >
              <p className="text-[10px] font-sans uppercase tracking-widest mb-6 opacity-80" style={{ color: "#C9A84C" }}>
                Your Purpose Statement
              </p>
              <p className="font-script text-3xl md:text-4xl text-white leading-relaxed max-w-full overflow-hidden break-words mx-auto">
                {purposeStatement}
              </p>
              <button onClick={onOpenPurposePage} className="mt-8 px-5 py-2.5 rounded-full text-xs font-sans border border-[#C9A84C]/50 text-[#C9A84C] hover:bg-[#C9A84C]/10" data-testid="button-open-purpose-page-summary">
                Open my purpose page to download or screenshot
              </button>
            </div>
          )}

          {themes.length > 0 && (
            <div>
              <p className="text-[10px] font-sans uppercase tracking-widest mb-4 text-center opacity-60">Your Purpose Themes</p>
              <div className="grid gap-4">
                {themes.map(t => (
                  <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6">
                    <h3 className="font-serif text-xl text-[#5A6B8C] mb-2">{t.name}</h3>
                    <p className="text-sm font-sans opacity-80 mb-5">{t.description}</p>
                    {t.evidence && t.evidence.length > 0 && (
                      <div className="border-t border-white/10 pt-4">
                        <p className="text-[10px] uppercase tracking-widest opacity-50 mb-3">Where this showed up</p>
                        <ul className="space-y-3">
                          {t.evidence.map((ev, i) => (
                            <li key={i} className="text-sm flex gap-3 leading-relaxed">
                              <span className="text-[#C9A84C] mt-0.5">✦</span>
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
                      <h3 className="font-serif text-lg text-[#C9A84C] mb-2">{c.title}</h3>
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
                  <p className="text-[10px] uppercase tracking-widest opacity-50 mb-3 text-[#5A6B8C]">Ways to live your purpose now</p>
                  <ul className="space-y-3">
                    {season.expressions?.map((exp, i) => (
                      <li key={i} className="text-sm flex gap-3 leading-relaxed">
                        <span className="text-[#C9A84C]">•</span> <span className="opacity-80">{exp}</span>
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
              <div className="bg-white/5 border border-[#C9A84C]/30 rounded-xl p-6 md:p-8">
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
                  <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-lg p-5 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-[#C9A84C] mb-2">One Step This Week</p>
                    <p className="text-base font-medium">{actionPlan.oneStepThisWeek}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-16 pb-8 text-center border-t border-white/10 mt-12">
            <p className="font-script text-3xl md:text-4xl text-[#C9A84C] mb-12">What's within you creates a ripple.</p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Link
                href="/purpose-lab"
                className="flex-1 py-3.5 px-6 rounded-full text-sm font-sans font-medium text-center transition-all hover:opacity-90 bg-[#1E3A6E] text-white"
              >
                Return to Purpose Lab
              </Link>
              <button
                onClick={onReset}
                className="flex-1 py-3.5 px-6 rounded-full text-sm font-sans font-medium border transition-all hover:bg-white/5 border-[#C9A84C]/40 text-[#C9A84C]"
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
