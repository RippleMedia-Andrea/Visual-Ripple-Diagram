import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getGetCurrentJourneyQueryKey,
  getGetCourseAccessQueryKey,
  useGetCurrentJourney,
  useGetCourseAccess,
  useRestartJourney,
  useUpdateJourney,
  useExtractJourneyDiscoveries,
  useUpdateStoryCard,
  useDeleteStoryCard,
  useUpdatePurposeTheme,
  useDeletePurposeTheme,
  useGetAccount,
  useRecordAiConsent,
  useRecordWelcomeSeen,
  type ChatMessage as ApiChatMessage,
  type Vision,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { STAGES, STORY_PROMPTS } from '@/constants/journey';
import { streamJourneyChat, type ChatMessage } from '@/lib/mobile-api';
import { useAuth } from '@/providers/AuthProvider';
import { useColors } from '@/hooks/useColors';
import { PUBLIC_APP_ORIGIN } from '@/lib/mobile-api';
import { MyDiscoveries } from './MyDiscoveries';
import { JourneySummary } from './JourneySummary';
import { ThemeCardView, SeasonFormView, ActionPlanFormView } from './Discoveries';
import { VisionForm } from './VisionForm';

import {
  useVoiceTranscription,
  RecordingBar,
  TranscriptPreview,
  StoryConfirmCardNative,
  RevealSummariesNative,
  PatternFormNative,
  PatternSummaryNative,
  PurposePageModal,
  PracticePanelNative,
} from './Part4Native';

function messageKey(message: ChatMessage, index: number) {
  return `${message.role}-${index}-${message.content.slice(0, 16)}`;
}

function extractPurposeOptions(messages: ChatMessage[]): string[] {
  const allText = messages
    .filter((message) => message.role === 'assistant')
    .map((message) => message.content)
    .join('\n');
  const options: string[] = [];
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

export function JourneyScreen() {
  const [practice, setPractice] = useState(false);
  return <JourneyScreenInner key={practice ? 'practice' : 'personal'} practice={practice} onTogglePractice={() => setPractice((p) => !p)} />;
}

function JourneyScreenInner({ practice, onTogglePractice }: { practice: boolean; onTogglePractice: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, signOut, deleteAccount } = useAuth();
  const journeyParams = { practice };
  const journeyKey = [...getGetCurrentJourneyQueryKey(journeyParams), user?.id];
  const journeyQuery = useGetCurrentJourney(journeyParams, { query: { queryKey: journeyKey } });
  const accountQuery = useGetAccount({ query: { queryKey: ["/api/account", user?.id] } });
  const courseAccess = useGetCourseAccess({ query: { enabled: Boolean(user), queryKey: [...getGetCourseAccessQueryKey(), user?.id] } });
  const recordConsent = useRecordAiConsent();
  const recordWelcome = useRecordWelcomeSeen();
  const updateJourney = useUpdateJourney();
  const restartJourney = useRestartJourney();
  const extractDiscoveries = useExtractJourneyDiscoveries();
  const updateStoryCard = useUpdateStoryCard();
  const deleteStoryCard = useDeleteStoryCard();
  const updatePurposeTheme = useUpdatePurposeTheme();
  const deletePurposeTheme = useDeletePurposeTheme();

  const [visibleStage, setVisibleStage] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState<Record<string, ChatMessage[]>>({});
  const [selectedPrompts, setSelectedPrompts] = useState<string[] | null>(null);
  const [purposeDraft, setPurposeDraft] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDiscoveries, setShowDiscoveries] = useState(false);
  const [reviewStageId, setReviewStageId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [streamError, setStreamError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [actionChecked, setActionChecked] = useState(false);
  const [impactChecked, setImpactChecked] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [transcript, setTranscript] = useState('');
  const [readAloudChecked, setReadAloudChecked] = useState(false);
  const [showPurposePage, setShowPurposePage] = useState(false);
  const [purposeNote, setPurposeNote] = useState('');
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftQueue = useRef<Promise<unknown>>(Promise.resolve());
  const hydratedStage = useRef<string | null>(null);
  const updateJourneyRef = useRef(updateJourney.mutateAsync);
  updateJourneyRef.current = updateJourney.mutateAsync;
  const voice = useVoiceTranscription((text) => {
    setTranscript((t) => {
      const next = t ? `${t} ${text}` : text;
      scheduleDraftSave({ [`${stageIdRef.current}__transcript`]: next });
      return next;
    });
  });
  const stageIdRef = useRef('reveal');

  const journey = journeyQuery.data;
  const stageIdx = visibleStage ?? journey?.currentStageIdx ?? 0;
  const stage = STAGES[stageIdx];
  const promptSelection = selectedPrompts ?? journey?.selectedPrompts ?? [];
  const serverMessages = (journey?.messages?.[stage.id] ?? []) as ApiChatMessage[];
  const messages = localMessages[stage.id] ?? serverMessages;
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);
  const isHistorical = !practice && stageIdx < (journey?.currentStageIdx ?? 0);
  const isComplete = journey?.status === 'complete';
  const purposeValue = purposeDraft ?? journey?.purposeStatement ?? '';
  stageIdRef.current = stage.id;
  const journeyIdRef = useRef<number | null>(null);
  journeyIdRef.current = journey?.id ?? null;

  const localDrafts = useRef<Record<string, string>>({});
  const failedDrafts = useRef<Record<string, string>>({});
  const [draftError, setDraftError] = useState('');
  function pushDrafts(patch: Record<string, string>) {
    const id = journeyIdRef.current;
    if (!id || !Object.keys(patch).length) return;
    queryClient.setQueryData<typeof journey>(journeyKey, previous => previous ? { ...previous, drafts: { ...previous.drafts, ...patch } } : previous);
    draftQueue.current = draftQueue.current
      .catch(() => undefined)
      .then(async () => {
        for (const k of Object.keys(patch)) delete failedDrafts.current[k];
        try {
          await updateJourneyRef.current({ id, data: { drafts: patch } });
          if (!Object.keys(failedDrafts.current).length) setDraftError('');
        } catch {
          failedDrafts.current = { ...failedDrafts.current, ...patch };
          setDraftError("Your latest draft hasn't saved yet. It's still on this screen.");
        }
      });
  }
  function retryDrafts() {
    const p = failedDrafts.current;
    failedDrafts.current = {};
    if (Object.keys(p).length) pushDrafts(p);
    else setDraftError('');
  }
  const pendingPatch = useRef<Record<string, string>>({});
  function scheduleDraftSave(patch: Record<string, string>) {
    localDrafts.current = { ...localDrafts.current, ...patch };
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      const p = pendingPatch.current;
      pendingPatch.current = {};
      draftTimer.current = null;
      pushDrafts(p);
    }, 800);
  }
  function flushDraftsNow(patch: Record<string, string>) {
    localDrafts.current = { ...localDrafts.current, ...patch };
    // cancel any stale debounced save so it can never overwrite a cleared draft
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = null;
    const p = { ...pendingPatch.current, ...patch };
    pendingPatch.current = {};
    pushDrafts(p);
  }

  useEffect(() => {
    if (!journey) return;
    const key = `${journey.id}:${stage.id}`;
    if (hydratedStage.current === key) return;
    if (hydratedStage.current) {
      const prevPending = pendingPatch.current;
      if (Object.keys(prevPending).length) flushDraftsNow({});
    }
    hydratedStage.current = key;
    const d = { ...((journey.drafts ?? {}) as Record<string, string>), ...localDrafts.current };
    setDraft(d[stage.id] ?? '');
    setTranscript(d[`${stage.id}__transcript`] ?? '');
  }, [journey, stage.id]);

  // flush pending typing when leaving (practice switch, sign out, unmount) so nothing is lost
  useEffect(() => () => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    const p = pendingPatch.current;
    pendingPatch.current = {};
    pushDrafts(p);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active' && Object.keys(pendingPatch.current).length) flushDraftsNow({});
    });
    return () => sub.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function changeDraft(value: string) {
    setDraft(value);
    scheduleDraftSave({ [stage.id]: value });
  }
  function changeTranscript(value: string) {
    setTranscript(value);
    scheduleDraftSave({ [`${stage.id}__transcript`]: value });
  }
  function useTranscriptInMessage() {
    const next = draft.trim() ? `${draft.trim()} ${transcript.trim()}` : transcript.trim();
    setDraft(next);
    setTranscript('');
    flushDraftsNow({ [stage.id]: next, [`${stage.id}__transcript`]: '' });
    inputRef.current?.focus();
  }
  function discardTranscript() {
    setTranscript('');
    flushDraftsNow({ [`${stage.id}__transcript`]: '' });
  }
  function seedDraft(text: string) {
    const next = draft.trim() ? `${draft.trim()}\n\n${text}` : text;
    changeDraft(next);
    inputRef.current?.focus();
  }

  async function savePattern(next: { actionWords: string[]; adjectives: string[]; impact: string; confirmed: boolean }) {
    if (!journey) return;
    await updateJourney.mutateAsync({ id: journey.id, data: { patternDiscovery: next } });
    await queryClient.invalidateQueries({ queryKey: journeyKey });
  }

  async function savePurposeNow() {
    if (!journey) return;
    const stmt = purposeValue.trim();
    if (!stmt || !actionChecked || !impactChecked || !readAloudChecked) return;
    setPurposeNote('');
    try {
      await updateJourney.mutateAsync({ id: journey.id, data: { purposeStatement: stmt, purposeOptions } });
      await queryClient.invalidateQueries({ queryKey: journeyKey });
      setPurposeNote('Saved. This is yours.');
    } catch {
      setPurposeNote("Your statement didn't save. Please try again.");
    }
  }

  const purposeOptions = useMemo(
    () => extractPurposeOptions((localMessages.pinpoint ?? journey?.messages?.pinpoint ?? []) as ChatMessage[]),
    [journey?.messages?.pinpoint, localMessages.pinpoint],
  );

  useEffect(() => {
    setLocalMessages({});
    setSelectedPrompts(null);
    setPurposeDraft(null);
    setVisibleStage(null);
    setStreamError('');
    setConfirmDeleteMode(false);
    setDeletePassword('');
    setActionChecked(false);
    setImpactChecked(false);
    setReadAloudChecked(false);
  }, [journey?.id]);

  function togglePrompt(id: string) {
    setSelectedPrompts(promptSelection[0] === id ? [] : [id]);
  }

  async function send() {
    const text = draft.trim();
    if (!text || !journey || isStreaming || isHistorical || isComplete) return;
    if (text.length > 4000) {
      setStreamError(`This message is ${text.length.toLocaleString()} characters. Each message can be up to 4,000. Your full text stays as a draft; send it in parts.`);
      return;
    }
    const previous = [...messages];
    const nextMessages: ChatMessage[] = [...previous, { role: 'user', content: text }];
    setLocalMessages((current) => ({ ...current, [stage.id]: nextMessages }));
    setDraft('');
    flushDraftsNow({ [stage.id]: '' });
    setStreamError('');
    setIsStreaming(true);
    let assistant = '';
    try {
      await streamJourneyChat({
        journeyId: journey.id,
        stage: stage.id,
        messages: nextMessages,
        context: {
          selectedPrompts: promptSelection,
          purposeStatement: purposeValue || undefined,
        },
        onChunk(chunk) {
          assistant += chunk;
          setLocalMessages((current) => ({
            ...current,
            [stage.id]: [...nextMessages, { role: 'assistant', content: assistant }],
          }));
        },
      });
      await queryClient.invalidateQueries({ queryKey: journeyKey });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setStreamError(error instanceof Error ? error.message : 'Unable to reach your guide.');
      if (!assistant) {
        setLocalMessages((current) => ({ ...current, [stage.id]: previous }));
        setDraft(text);
        flushDraftsNow({ [stage.id]: text });
      }
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  async function beginStage() {
    if (!journey || stageIdx === 0 || messages.length > 0 || isHistorical || isComplete) return;

    const promptLabels = promptSelection
      .map((id) => STORY_PROMPTS.find((p) => p.id === id)?.label ?? id)
      .join(', ');

    const openingPrompt =
      stageIdx === 1
        ? "I'm ready for Identify. My Reveal summaries are saved and shown on screen. Before offering any observations of your own, ask me what I notice repeating across my stories, especially what I do and the impact on others."
        : stageIdx === 2
        ? "I'm ready for Pinpoint. Show me my action and impact from Identify. Offer the optional form I wake up each day to [action] so that [impact], and make clear my own words are welcome. Help me draft, then ask why the impact matters more than once until it reaches the real change in someone else's life. Encourage plain everyday words. When I have a draft, invite me to read it out loud and ask if it feels true, not impressive, just true."
        : stageIdx === 3
        ? "I'm ready for Picture. Ask what I picture when I imagine living my purpose, then explore where that picture came from, one question at a time."
        : stageIdx === 4
        ? "I'm ready for Live, Your Season. Begin with Right now I'm in the season of... Then explore my roles and where purpose is already showing up before practical next steps."
        : "I've completed all stages. Please begin Stage 6 and guide me into reflection.";

    setIsStreaming(true);
    setStreamError('');
    let assistant = '';
    try {
      await streamJourneyChat({
        journeyId: journey.id,
        stage: stage.id,
        messages: [{ role: 'user', content: openingPrompt }],
        context: {
          selectedPrompts: promptSelection,
          purposeStatement: purposeValue || undefined,
        },
        saveUserMessage: false,
        onChunk(chunk) {
          assistant += chunk;
          setLocalMessages((current) => ({
            ...current,
            [stage.id]: [{ role: 'assistant', content: assistant }],
          }));
        },
      });
      await queryClient.invalidateQueries({ queryKey: journeyKey });
    } catch (error) {
      setStreamError(error instanceof Error ? error.message : 'Unable to begin this stage.');
    } finally {
      setIsStreaming(false);
    }
  }

  async function beginStage0() {
    if (!journey || stageIdx !== 0 || messages.length > 0 || isHistorical || isComplete) return;
    const promptLabels = promptSelection
      .map((id) => STORY_PROMPTS.find((p) => p.id === id)?.label ?? id)
      .join(', ');
    if (promptSelection.length === 0) {
      setStreamError('Choose a prompt for your first story.');
      return;
    }
    const openingPrompt = `Welcome me to Reveal, Your Story. I chose this prompt for my first story: ${promptLabels}. Invite me to tell it my own way, one question at a time. Afterwards reflect back What you felt, What you did, and What changed, using my words, and ask if it sounds right. Do not name patterns or purpose yet.`;

    setIsStreaming(true);
    setStreamError('');
    let assistant = '';
    try {
      await streamJourneyChat({
        journeyId: journey.id,
        stage: stage.id,
        messages: [{ role: 'user', content: openingPrompt }],
        context: {
          selectedPrompts: promptSelection,
          purposeStatement: purposeValue || undefined,
        },
        saveUserMessage: false,
        onChunk(chunk) {
          assistant += chunk;
          setLocalMessages((current) => ({
            ...current,
            [stage.id]: [{ role: 'assistant', content: assistant }],
          }));
        },
      });
      await queryClient.invalidateQueries({ queryKey: journeyKey });
    } catch (error) {
      setStreamError(error instanceof Error ? error.message : 'Unable to begin this stage.');
    } finally {
      setIsStreaming(false);
    }
  }

  async function runExtraction(stageId: string) {
    if (!journey) return;
    setIsExtracting(true);
    setExtractionFailed(false);
    try {
      await extractDiscoveries.mutateAsync({ id: journey.id, stage: stageId as "reveal" | "identify" | "picture" | "live" });
      await queryClient.invalidateQueries({ queryKey: journeyKey });
    } catch (error) {
      setExtractionFailed(true);
    } finally {
      setIsExtracting(false);
    }
  }

  async function completeReviewAndContinue() {
    if (!journey) return;
    if (!practice && ((reviewStageId === 'reveal' && (journey.storyCards ?? []).filter((c) => c.confirmed).length < 2) || (reviewStageId === 'identify' && !journey.patternDiscovery?.confirmed))) return;
    try {
      await moveToNextStage();
      setReviewStageId(null);
      setExtractionFailed(false);
    } catch (error) {
      setReviewStageId(null);
      setStreamError(`We couldn't move you forward yet. ${error instanceof Error ? error.message : ''} Nothing was lost. Please try again.`.trim());
    }
  }

  async function moveToNextStage() {
    if (!journey) return;
    const nextStage = Math.min(stageIdx + 1, 5);
    const updated = await updateJourney.mutateAsync({
      id: journey.id,
      data: {
        currentStageIdx: Math.max(journey.currentStageIdx, nextStage),
        selectedPrompts: promptSelection,
        purposeOptions,
        status: stageIdx === 5 ? 'complete' : 'in_progress',
      },
    });
    if (stageIdx === 5) {
      queryClient.setQueryData(journeyKey, {
        ...journey,
        ...updated,
        messages: {
          ...journey.messages,
          [stage.id]: localMessages[stage.id] ?? journey.messages[stage.id],
        },
      });
      setVisibleStage(5);
    } else {
      await queryClient.invalidateQueries({ queryKey: journeyKey });
      setVisibleStage(nextStage);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function continueStage() {
    if (!journey || isStreaming || voice.state !== 'idle') return;
    if (isHistorical) {
      setVisibleStage(journey.currentStageIdx);
      return;
    }
    if (messages.length === 0) {
      setStreamError('Begin this stage with your guide before continuing.');
      return;
    }
    if (!practice && stageIdx === 2 && !journey.purposeStatement) {
      setStreamError('Save your purpose statement before continuing.');
      return;
    }
    if (!practice && stageIdx === 2 && !purposeValue.trim()) {
      setStreamError('Choose or write the purpose statement that feels most true.');
      return;
    }
    if (!practice && stageIdx === 2 && purposeValue !== journey.purposeStatement && (!actionChecked || !impactChecked || !readAloudChecked)) {
      setStreamError('Check your statement, read it out loud, and save it before continuing.');
      return;
    }
    if (!practice && stageIdx === 1 && !journey.patternDiscovery?.confirmed) {
      setStreamError('Confirm your action and impact below before continuing.');
      return;
    }

    if (['reveal', 'identify', 'picture', 'live'].includes(stage.id)) {
      setReviewStageId(stage.id);
      runExtraction(stage.id);
      return;
    }

    try {
      await moveToNextStage();
    } catch (error) {
      setStreamError(`We couldn't move you forward yet. ${error instanceof Error ? error.message : ''} Nothing was lost. Please try again.`.trim());
    }
  }

  const [confirmDeleteMode, setConfirmDeleteMode] = useState(false);

  function initiateDelete() {
    setDeleteError('');
    setDeletePassword('');
    setConfirmDeleteMode(true);
  }

  async function performDelete() {
    if (deletePassword.length < 8) {
      setDeleteError('Enter your current password to delete your account.');
      return;
    }
    setDeleteError('');
    try {
      await deleteAccount(deletePassword);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Unable to delete your account. Please try again.');
    }
  }

  async function saveVision(vision: Vision) {
    if (!journey) throw new Error('Your journey is not available.');
    await updateJourney.mutateAsync({ id: journey.id, data: { vision } });
    await queryClient.invalidateQueries({ queryKey: journeyKey });
  }

  async function restart() {
    if (!journey) return;
    const next = await restartJourney.mutateAsync({ id: journey.id });
    queryClient.setQueryData(journeyKey, next);
    setLocalMessages({});
    setSelectedPrompts([]);
    setPurposeDraft(null);
    setVisibleStage(0);
    setShowSettings(false);
    setShowDiscoveries(false);
    setReviewStageId(null);
  }

  async function acceptConsent() {
    await recordConsent.mutateAsync();
    await accountQuery.refetch();
  }

  async function beginWelcome() {
    await recordWelcome.mutateAsync();
    await accountQuery.refetch();
  }

  function openPublicPage(path: string) {
    if (PUBLIC_APP_ORIGIN) void WebBrowser.openBrowserAsync(`${PUBLIC_APP_ORIGIN}${path}`);
  }

  if (accountQuery.isLoading || journeyQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Opening your journey…</Text>
      </View>
    );
  }
  if (accountQuery.isError || !accountQuery.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="shield" size={34} color={colors.primary} />
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Your account couldn’t be verified</Text>
        <Pressable onPress={() => accountQuery.refetch()} style={[styles.retry, { backgroundColor: colors.primary }]}>
          <Text style={[styles.buttonLabel, { color: colors.primaryForeground }]}>Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (!accountQuery.data.aiConsentAt) {
    return (
      <JourneyGate
        title="Before you begin"
        body="I understand my answers are processed by a third-party AI service (Anthropic's Claude) to guide my Purpose Lab journey. If I use the microphone, my recording is sent to OpenAI for transcription when I stop recording. I can edit or discard the transcript, and it is only sent to my guide when I press send. The app does not keep raw recordings. See the Privacy Policy for details."
        actionLabel="I understand. Continue"
        checked={consentChecked}
        onToggle={() => setConsentChecked((current) => !current)}
        onAction={acceptConsent}
        isPending={recordConsent.isPending}
        testID="journey-consent"
        colors={colors}
        onLink={() => openPublicPage('/privacy')}
      />
    );
  }
  if (!accountQuery.data.welcomeSeenAt) {
    return (
      <JourneyGate
        title="Welcome to the Purpose Lab"
        body="Over six short stages, you'll share a few stories from your life, notice the patterns in them, and put words to your purpose.\n\nGo at your own pace. Your progress saves automatically, so you can pause anytime and pick up on any device.\n\nYour journey is private to you. Take what you discover into prayer and share it with people you trust."
        note={courseAccess.data?.courseBuyer ? "Your course includes full Purpose Lab access. Most people finish in 45 to 90 minutes, across one or more sittings." : "Most people finish in 45 to 90 minutes, across one or more sittings."}
        actionLabel="Begin"
        onAction={beginWelcome}
        isPending={recordWelcome.isPending}
        testID="welcome-screen"
        colors={colors}
      />
    );
  }
  if (journeyQuery.isError || !journey) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="cloud-off" size={34} color={colors.primary} />
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Your journey couldn’t load</Text>
        <Pressable onPress={() => journeyQuery.refetch()} style={[styles.retry, { backgroundColor: colors.primary }]}>
          <Text style={[styles.buttonLabel, { color: colors.primaryForeground }]}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (isComplete) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ height: Math.max(insets.top, Platform.OS === 'web' ? 67 : 0), backgroundColor: colors.background }} />
        <JourneySummary
          storyCards={journey?.storyCards ?? []}
          themes={journey?.themes ?? []}
          season={journey?.season ?? null}
          actionPlan={journey?.actionPlan ?? null}
          purposeStatement={journey?.purposeStatement ?? null}
          onReset={restart}
          onOpenDiscoveries={() => setShowDiscoveries(true)}
        />
        {journey.purposeStatement ? (
          <Pressable testID="open-purpose-page-summary" onPress={() => setShowPurposePage(true)} style={[styles.retry, { backgroundColor: colors.primary, alignSelf: 'center', marginBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={[styles.buttonLabel, { color: colors.primaryForeground }]}>Open my purpose page</Text>
          </Pressable>
        ) : null}
        <PurposePageModal visible={showPurposePage} statement={journey.purposeStatement ?? ''} pattern={journey.patternDiscovery} onClose={() => setShowPurposePage(false)} />
        <MyDiscoveries
          isOpen={showDiscoveries}
          onClose={() => setShowDiscoveries(false)}
          storyCards={journey?.storyCards ?? []}
          themes={journey?.themes ?? []}
          season={journey?.season ?? null}
          vision={journey?.vision ?? null}
          onUpdateVision={saveVision}
          actionPlan={journey?.actionPlan ?? null}
          purposeStatement={journey?.purposeStatement ?? null}
          onUpdateStoryCard={(card) => updateStoryCard.mutateAsync(card)}
          onDeleteStoryCard={(id) => deleteStoryCard.mutateAsync({ id })}
          onUpdateTheme={(theme) => updatePurposeTheme.mutateAsync(theme)}
          onDeleteTheme={(id) => deletePurposeTheme.mutateAsync({ id })}
          onUpdateSeason={(s) => updateJourney.mutateAsync({ id: journey.id, data: { season: s } })}
          onUpdateActionPlan={(ap) => updateJourney.mutateAsync({ id: journey.id, data: { actionPlan: ap } })}
        />
      </View>
    );
  }

  const confirmedCount = (journey.storyCards ?? []).filter((c) => c.confirmed).length;
  const reviewBlocked = !practice && ((reviewStageId === 'reveal' && confirmedCount < 2) || (reviewStageId === 'identify' && !journey.patternDiscovery?.confirmed));

  const header = (
    <View>
      <View style={[styles.stageHero, { backgroundColor: stage.color }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.stageNumber, { color: stage.textColor }]}>{stage.number} / 06</Text>
            <Text style={[styles.stageTitle, { color: stage.textColor }]}>{stage.title}</Text>
            <Text style={[styles.stageSubtitle, { color: stage.textColor }]}>{stage.subtitle}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              testID="discoveries-trigger"
              accessibilityLabel="My Discoveries"
              onPress={() => setShowDiscoveries(true)}
              style={styles.discoveriesButton}
            >
              <Text style={[styles.discoveriesText, { color: stage.textColor }]}>My Discoveries</Text>
            </Pressable>
            <Pressable
              testID="toggle-practice"
              accessibilityRole="switch"
              accessibilityState={{ checked: practice }}
              disabled={isStreaming || voice.state !== 'idle'}
              onPress={onTogglePractice}
              style={[styles.discoveriesButton, { borderWidth: 1, borderColor: stage.textColor, borderRadius: 14, paddingHorizontal: 8, opacity: practice ? 1 : 0.7 }]}
            >
              <Text style={[styles.discoveriesText, { color: stage.textColor }]}>{practice ? 'Practice on' : 'Practice'}</Text>
            </Pressable>
            <Pressable
              testID="settings-button"
              accessibilityLabel="Account settings"
              onPress={() => setShowSettings(true)}
              style={styles.iconButton}
            >
              <Feather name="settings" size={22} color={stage.textColor} />
            </Pressable>
          </View>
        </View>
        <View style={styles.progressRow}>
          {STAGES.map((item, index) => (
            <Pressable
              key={item.id}
              disabled={isStreaming || voice.state !== 'idle' || (!practice && index > journey.currentStageIdx)}
              onPress={() => setVisibleStage(index)}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= journey.currentStageIdx ? colors.accent : 'transparent',
                  borderColor: stage.textColor,
                  opacity: practice || index <= journey.currentStageIdx ? 1 : 0.4,
                },
              ]}
            />
          ))}
        </View>
      </View>
      {practice ? <PracticePanelNative colors={colors} onUseSample={seedDraft} /> : null}
      {stageIdx === 1 ? <RevealSummariesNative cards={journey.storyCards ?? []} colors={colors} /> : null}
      {stageIdx === 1 ? <PatternFormNative key={`${journey.id}`} value={journey.patternDiscovery ?? null} onSave={savePattern} colors={colors} /> : null}
      {stageIdx === 2 ? <PatternSummaryNative value={journey.patternDiscovery} colors={colors} /> : null}
      {stageIdx === 0 && messages.length > 0 && !isHistorical ? (
        <View testID="next-story-prompts" style={{ paddingHorizontal: 16, paddingTop: 10, gap: 8 }}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>READY FOR ANOTHER STORY? CHOOSE A DIFFERENT PROMPT</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {STORY_PROMPTS.map((p) => {
              const used = promptSelection.includes(p.id);
              return (
                <Pressable
                  key={p.id}
                  testID={`next-prompt-${p.id}`}
                  onPress={() => {
                    if (!used) setSelectedPrompts([...promptSelection, p.id]);
                    seedDraft(`For my next story I chose: ${p.label}. `);
                  }}
                  style={{ borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, borderColor: used ? colors.accent : colors.border, backgroundColor: used ? colors.secondary : 'transparent' }}
                >
                  <Text style={[styles.promptDesc, { color: colors.foreground }]}>{used ? 'Used: ' : ''}{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
      <View style={[styles.teachingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.belief, { color: colors.primary }]}>{stage.belief}</Text>
        <Text style={[styles.teaching, { color: colors.foreground }]}>{stage.teaching}</Text>
      </View>
      {stageIdx === 3 && journey?.vision ? <VisionForm vision={journey.vision} onSave={async (vision) => {
        await updateJourney.mutateAsync({ id: journey.id, data: { vision } });
        await queryClient.invalidateQueries({ queryKey: journeyKey });
      }} /> : null}
      {stageIdx === 4 && (journey?.messages.personalize.length ?? 0) > 0 ? <View style={{ padding: 16, gap: 8 }}>
        <Text style={{ color: colors.foreground, fontWeight: '600' }}>Earlier season reflection</Text>
        <Text style={{ color: colors.mutedForeground }}>Your original words from the earlier journey are preserved here.</Text>
        {journey?.messages.personalize.map((message, index) => <Text key={index} style={{ color: colors.foreground }}>{message.role === 'user' ? 'You' : 'Guide'}: {message.content}</Text>)}
      </View> : null}
      {stageIdx === 5 ? <Text style={{ color: colors.mutedForeground, padding: 16 }}>Expand exercise retained for your review.</Text> : null}
      {stageIdx === 0 && messages.length === 0 ? (
        <View style={styles.promptSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TWO STORIES WHERE YOU FELT MOST LIKE YOURSELF</Text>
          <Text style={{ color: colors.foreground }}>Choose any optional extra prompts below, or begin with your own stories.</Text>
          {STORY_PROMPTS.map((prompt) => {
            const selected = promptSelection.includes(prompt.id);
            return (
              <Pressable
                key={prompt.id}
                testID={`prompt-${prompt.id}`}
                onPress={() => togglePrompt(prompt.id)}
                style={[
                  styles.prompt,
                  {
                    backgroundColor: selected ? colors.secondary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.promptText, { color: colors.foreground }]}>{prompt.label}</Text>
                  <Text style={[styles.promptDesc, { color: colors.mutedForeground }]}>{prompt.description}</Text>
                </View>
                <Feather name={selected ? 'check-circle' : 'circle'} size={20} color={selected ? colors.primary : colors.mutedForeground} />
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="message-circle" size={28} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your guide is ready</Text>
          <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
            {stageIdx === 0
              ? 'Share what comes to mind. There are no perfect answers here.'
              : 'Bring your previous reflection forward into this stage.'}
          </Text>
          {stageIdx > 0 && !isHistorical && !isComplete ? (
            <Pressable
              testID="begin-stage"
              disabled={isStreaming}
              onPress={beginStage}
              style={[styles.beginButton, { backgroundColor: colors.secondary }]}
            >
              <Text style={[styles.beginLabel, { color: colors.secondaryForeground }]}>Begin this stage</Text>
              <Feather name="arrow-right" size={17} color={colors.primary} />
            </Pressable>
          ) : null}
          {stageIdx === 0 && !isHistorical && !isComplete ? (
            <Pressable
              testID="begin-stage-0"
              disabled={isStreaming}
              onPress={beginStage0}
              style={[styles.beginButton, { backgroundColor: colors.secondary }]}
            >
              <Text style={[styles.beginLabel, { color: colors.secondaryForeground }]}>Confirm and begin</Text>
              <Feather name="arrow-right" size={17} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {stageIdx === 2 && messages.length > 0 ? (
        <View style={[styles.purposeCard, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>YOUR PURPOSE STATEMENT</Text>
          {purposeOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => { setPurposeDraft(option); setActionChecked(false); setImpactChecked(false); setReadAloudChecked(false); }}
              style={[
                styles.purposeOption,
                {
                  backgroundColor: purposeValue === option ? colors.primary : colors.card,
                  borderColor: purposeValue === option ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.promptText, { color: purposeValue === option ? colors.primaryForeground : colors.foreground }]}>
                {option}
              </Text>
            </Pressable>
          ))}
          <TextInput
            testID="purpose-statement"
            value={purposeValue}
            onChangeText={(value) => { setPurposeDraft(value); setActionChecked(false); setImpactChecked(false); setReadAloudChecked(false); }}
            placeholder="I wake up each day to [action] so that [impact]. Or use your own words."
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.purposeInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input }]}
          />
          <Text style={{ color: colors.foreground }}>The form is optional. Include both an action and an outward impact.</Text>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: actionChecked }} onPress={() => setActionChecked(!actionChecked)}>
            <Text style={{ color: colors.primary }}><Feather name={actionChecked ? 'check-square' : 'square'} size={15} /> My statement names my action.</Text>
          </Pressable>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: impactChecked }} onPress={() => setImpactChecked(!impactChecked)}>
            <Text style={{ color: colors.primary }}><Feather name={impactChecked ? 'check-square' : 'square'} size={15} /> My statement names the impact on others.</Text>
          </Pressable>
          <Pressable testID="check-read-aloud" accessibilityRole="checkbox" accessibilityState={{ checked: readAloudChecked }} onPress={() => setReadAloudChecked(!readAloudChecked)}>
            <Text style={{ color: colors.primary }}><Feather name={readAloudChecked ? 'check-square' : 'square'} size={15} /> I read it out loud. It feels true. Not impressive, just true.</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Pressable
              testID="save-purpose"
              disabled={!purposeValue.trim() || !actionChecked || !impactChecked || !readAloudChecked || updateJourney.isPending}
              onPress={savePurposeNow}
              style={[styles.retry, { backgroundColor: colors.primary, opacity: purposeValue.trim() && actionChecked && impactChecked && readAloudChecked ? 1 : 0.4 }]}
            >
              <Text style={[styles.buttonLabel, { color: colors.primaryForeground }]}>Save my statement</Text>
            </Pressable>
            {journey.purposeStatement ? (
              <Pressable testID="open-purpose-page" onPress={() => setShowPurposePage(true)} style={[styles.retry, { backgroundColor: colors.card }]}>
                <Text style={[styles.buttonLabel, { color: colors.primary }]}>Open purpose page</Text>
              </Pressable>
            ) : null}
          </View>
          {purposeNote ? <Text style={{ color: colors.mutedForeground }}>{purposeNote}</Text> : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.background }]} behavior="padding" keyboardVerticalOffset={0}>
      <View style={{ height: Math.max(insets.top, Platform.OS === 'web' ? 67 : 0), backgroundColor: stage.color }} />
      {reviewStageId ? (
        <View style={[styles.reviewOverlay, { backgroundColor: colors.background }]}>
          {isExtracting ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground, marginTop: 12 }]}>Gathering what you shared…</Text>
            </View>
          ) : extractionFailed ? (
            <View style={styles.center}>
              <Feather name="alert-circle" size={34} color={colors.destructive} />
              <Text style={[styles.errorTitle, { color: colors.foreground }]}>Unable to gather</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <Pressable testID="retry-extraction" onPress={() => runExtraction(reviewStageId)} style={[styles.retry, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.buttonLabel, { color: colors.primaryForeground }]}>Try again</Text>
                </Pressable>
                {reviewStageId === 'reveal' || reviewStageId === 'identify' ? (
                  <Pressable testID="back-to-conversation" onPress={() => { setReviewStageId(null); setExtractionFailed(false); }} style={[styles.retry, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.buttonLabel, { color: colors.secondaryForeground }]}>Back to the conversation</Text>
                  </Pressable>
                ) : (
                  <Pressable testID="continue-anyway" onPress={completeReviewAndContinue} style={[styles.retry, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.buttonLabel, { color: colors.secondaryForeground }]}>Continue anyway</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={[styles.reviewHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.reviewTitle, { color: colors.primary }]}>Here's what I heard</Text>
              </View>
              <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {reviewStageId === 'reveal' && (journey?.storyCards?.length ?? 0) > 0 ? (
                  <View style={{ marginBottom: 32 }}>
                    <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 12 }]}>YOUR STORIES</Text>
                    {journey?.storyCards?.map((card, i) => (
                      <StoryConfirmCardNative
                        key={card.id}
                        card={card}
                        index={i}
                        colors={colors}
                        onSave={async (data) => {
                          await updateStoryCard.mutateAsync({ id: Number(card.id), data });
                          await queryClient.invalidateQueries({ queryKey: journeyKey });
                        }}
                        onDelete={async () => {
                          await deleteStoryCard.mutateAsync({ id: Number(card.id) });
                          await queryClient.invalidateQueries({ queryKey: journeyKey });
                        }}
                      />
                    ))}
                  </View>
                ) : null}

                {reviewStageId === 'reveal' && (journey?.storyCards?.length ?? 0) === 0 ? (
                  <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>No stories were gathered yet. Return to the conversation and share a story first.</Text>
                ) : null}
                {reviewStageId === 'identify' ? <PatternSummaryNative value={journey?.patternDiscovery} colors={colors} /> : null}
                {reviewStageId === 'identify' && (journey?.themes?.length ?? 0) > 0 ? (
                  <View style={{ marginBottom: 32 }}>
                    <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 12 }]}>YOUR THEMES</Text>
                    {journey?.themes?.map((theme) => (
                      <ThemeCardView
                        key={theme.id}
                        theme={theme}
                        onUpdate={(t) => updatePurposeTheme.mutateAsync(t)}
                        onDelete={() => theme.id && deletePurposeTheme.mutateAsync({ id: theme.id })}
                      />
                    ))}
                  </View>
                ) : null}

                {reviewStageId === 'picture' && journey?.vision ? <VisionForm vision={journey.vision} onSave={async (vision) => {
                  await updateJourney.mutateAsync({ id: journey.id, data: { vision } });
                  await queryClient.invalidateQueries({ queryKey: journeyKey });
                }} /> : null}
                {reviewStageId === 'live' && journey?.season ? (
                  <View style={{ marginBottom: 32 }}>
                    <SeasonFormView season={journey.season} onUpdate={(s) => { if (journey) updateJourney.mutateAsync({ id: journey.id, data: { season: s } }); }} />
                  </View>
                ) : null}

                {reviewStageId === 'live' && journey?.actionPlan ? (
                  <View style={{ marginBottom: 32 }}>
                    <ActionPlanFormView actionPlan={journey.actionPlan} onUpdate={(ap) => { if (journey) updateJourney.mutateAsync({ id: journey.id, data: { actionPlan: ap } }); }} />
                  </View>
                ) : null}
              </ScrollView>

              <View style={[styles.reviewFooter, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 24) }]}>
                {reviewStageId === 'reveal' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Text testID="confirmed-count" style={[styles.promptDesc, { color: colors.mutedForeground, flex: 1 }]}>
                      {confirmedCount} confirmed. Confirm at least two stories to continue.
                    </Text>
                    <Pressable testID="tell-another-story" onPress={() => setReviewStageId(null)} style={{ borderWidth: 1, borderColor: colors.primary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 }}>
                      <Text style={[styles.promptDesc, { color: colors.primary }]}>Tell another story</Text>
                    </Pressable>
                  </View>
                ) : null}
                <Pressable testID="complete-review" disabled={reviewBlocked} onPress={completeReviewAndContinue} style={[styles.reviewPrimaryBtn, { backgroundColor: colors.primary, opacity: reviewBlocked ? 0.4 : 1 }]}>
                  <Text style={[styles.reviewPrimaryBtnText, { color: colors.primaryForeground }]}>This feels right. Continue</Text>
                  <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      ) : (
        <FlatList
        data={reversedMessages}
        keyExtractor={messageKey}
        inverted={messages.length > 0}
        ListFooterComponent={header}
        ListHeaderComponent={isStreaming && !messages.at(-1)?.content ? <TypingIndicator color={colors.primary} /> : null}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.role === 'user'
                ? { backgroundColor: colors.primary, alignSelf: 'flex-end' }
                : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, alignSelf: 'flex-start' },
            ]}
          >
            <Text style={[styles.messageText, { color: item.role === 'user' ? colors.primaryForeground : colors.foreground }]}>
              {item.content}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      )}
      {streamError ? <Text style={[styles.inlineError, { color: colors.destructive }]}>{streamError}</Text> : null}
      {!isComplete && !reviewStageId && (transcript || voice.state === 'transcribing') ? (
        <TranscriptPreview value={transcript} busy={voice.state === 'transcribing'} onChange={changeTranscript} onUse={useTranscriptInMessage} onDiscard={discardTranscript} colors={colors} />
      ) : null}
      {draftError ? (
        <Pressable onPress={retryDrafts} testID="draft-error"><Text style={[styles.inlineError, { color: colors.destructive }]}>{draftError} Tap to save again.</Text></Pressable>
      ) : null}
      {voice.error ? (
        <Pressable onPress={voice.clearError} testID="voice-error"><Text style={[styles.inlineError, { color: colors.destructive }]}>{voice.error}</Text></Pressable>
      ) : null}
      {isComplete ? null : (
        <View style={[styles.composer, { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 8) }]}>
          {voice.state === 'recording' ? (
            <RecordingBar seconds={voice.seconds} onCancel={voice.cancel} colors={colors} />
          ) : (
          <TextInput
            ref={inputRef}
            testID="chat-input"
            value={draft}
            onChangeText={changeDraft}
            placeholder={stage.placeholder}
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={20000}
            blurOnSubmit={false}
            editable={!isHistorical && !isComplete}
            style={[styles.chatInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input, opacity: isHistorical || isComplete ? 0.55 : 1 }]}
          />
          )}
          <Pressable
            testID="mic-button"
            accessibilityLabel={voice.state === 'recording' ? 'Stop recording' : 'Record your reflection'}
            disabled={isHistorical || voice.state === 'transcribing'}
            onPress={() => (voice.state === 'recording' ? voice.stop() : voice.start())}
            style={({ pressed }) => [styles.sendButton, { backgroundColor: voice.state === 'recording' ? colors.destructive : colors.secondary, opacity: pressed || isHistorical ? 0.5 : 1 }]}
          >
            <Feather name={voice.state === 'recording' ? 'square' : 'mic'} size={18} color={voice.state === 'recording' ? colors.destructiveForeground : colors.primary} />
          </Pressable>
          <Pressable
            testID="send-button"
            accessibilityLabel="Send reflection"
            disabled={!draft.trim() || isStreaming || isHistorical || isComplete}
            onPress={send}
            style={({ pressed }) => [styles.sendButton, { backgroundColor: colors.primary, opacity: pressed || !draft.trim() ? 0.5 : 1 }]}
          >
            <Feather name="arrow-up" size={20} color={colors.primaryForeground} />
          </Pressable>
          <Pressable
            testID="continue-button"
            accessibilityLabel={isHistorical ? 'Return to current stage' : stageIdx === 5 ? 'Complete journey' : 'Continue to next stage'}
            disabled={updateJourney.isPending || isComplete || isStreaming || voice.state !== 'idle'}
            onPress={continueStage}
            style={styles.nextButton}
          >
            <Feather name={isHistorical ? 'corner-down-right' : stageIdx === 5 ? 'check' : 'chevron-right'} size={24} color={colors.primary} />
          </Pressable>
        </View>
      )}

      <MyDiscoveries
        isOpen={showDiscoveries}
        onClose={() => setShowDiscoveries(false)}
        storyCards={journey?.storyCards ?? []}
        themes={journey?.themes ?? []}
        season={journey?.season ?? null}
        vision={journey?.vision ?? null}
        onUpdateVision={saveVision}
        actionPlan={journey?.actionPlan ?? null}
        purposeStatement={journey?.purposeStatement ?? null}
        onUpdateStoryCard={(card) => updateStoryCard.mutateAsync(card)}
        onDeleteStoryCard={(id) => deleteStoryCard.mutateAsync({ id })}
        onUpdateTheme={(theme) => updatePurposeTheme.mutateAsync(theme)}
        onDeleteTheme={(id) => deletePurposeTheme.mutateAsync({ id })}
        onUpdateSeason={(s) => { if (journey) updateJourney.mutateAsync({ id: journey.id, data: { season: s } }); }}
        onUpdateActionPlan={(ap) => { if (journey) updateJourney.mutateAsync({ id: journey.id, data: { actionPlan: ap } }); }}
      />

      <PurposePageModal visible={showPurposePage} statement={journey.purposeStatement ?? ''} pattern={journey.patternDiscovery} onClose={() => setShowPurposePage(false)} />
      <Modal visible={showSettings} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSettings(false)}>
        <View style={[styles.settings, { backgroundColor: colors.background, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.settingsHeader}>
            <Text style={[styles.settingsTitle, { color: colors.foreground }]}>Your account</Text>
            <Pressable accessibilityLabel="Close settings" onPress={() => setShowSettings(false)} style={styles.iconButton}>
              <Feather name="x" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <Text style={[styles.settingsCopy, { color: colors.mutedForeground }]}>
            Your progress is shared securely across Purpose Lab on web, iPhone, and Android.
          </Text>
          {courseAccess.data?.courseBuyer && <Text style={[styles.settingsCopy, { color: colors.foreground }]}>Your course includes full Purpose Lab access.</Text>}
          <View style={styles.settingsLinks}>
            {([
              ['Privacy Policy', '/privacy', 'privacy-settings-link'],
              ['Terms of Use', '/terms', 'terms-settings-link'],
              ['Need help?', '/support', 'support-settings-link'],
            ] as const).map(([label, path, testID]) => (
              <Pressable key={path} testID={testID} onPress={() => openPublicPage(path)} style={[styles.settingsLink, { borderBottomColor: colors.border }]}>
                <Text style={[styles.actionText, { color: colors.primary }]}>{label}</Text>
                <Feather name="external-link" size={16} color={colors.primary} />
              </Pressable>
            ))}
          </View>
          <Pressable testID="restart-journey-settings" onPress={restart} style={[styles.settingsAction, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="refresh-ccw" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Begin a new journey</Text>
          </Pressable>
          <Pressable onPress={signOut} style={[styles.settingsAction, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="log-out" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Sign out</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          {confirmDeleteMode ? (
            <View style={{ gap: 12 }}>
              <Text style={[styles.settingsCopy, { color: colors.destructive }]}>
                This action is permanent. Please enter your password to confirm.
              </Text>
              <TextInput
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholder="Password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                testID="delete-password-input"
                style={[styles.passwordInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.destructive }]}
              />
              {deleteError ? (
                <Text testID="delete-account-error" style={[styles.deleteError, { color: colors.destructive }]}>
                  {deleteError}
                </Text>
              ) : null}
              <Pressable testID="confirm-delete" onPress={performDelete} style={[styles.settingsAction, { backgroundColor: colors.destructive, borderColor: colors.destructive }]}>
                <Feather name="alert-triangle" size={20} color={colors.destructiveForeground} />
                <Text style={[styles.actionText, { color: colors.destructiveForeground }]}>Confirm Deletion</Text>
              </Pressable>
              <Pressable onPress={() => { setConfirmDeleteMode(false); setDeleteError(''); setDeletePassword(''); }} style={[styles.settingsAction, { borderColor: colors.border }]}>
                <Text style={[styles.actionText, { color: colors.foreground, textAlign: 'center', flex: 1 }]}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable testID="delete-account" onPress={initiateDelete} style={[styles.settingsAction, { borderColor: colors.destructive }]}>
              <Feather name="trash-2" size={20} color={colors.destructive} />
              <Text style={[styles.actionText, { color: colors.destructive }]}>Delete account permanently</Text>
            </Pressable>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function TypingIndicator({ color }: { color: string }) {
  return (
    <View style={styles.typing}>
      <ActivityIndicator size="small" color={color} />
      <Text style={[styles.loadingText, { color }]}>Your guide is reflecting…</Text>
    </View>
  );
}

function JourneyGate({
  title,
  body,
  note,
  actionLabel,
  checked,
  onToggle,
  onAction,
  isPending,
  testID,
  colors,
  onLink,
}: {
  title: string;
  body: string;
  note?: string;
  actionLabel: string;
  checked?: boolean;
  onToggle?: () => void;
  onAction: () => Promise<void>;
  isPending: boolean;
  testID: string;
  colors: ReturnType<typeof useColors>;
  onLink?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');
  return (
    <View style={[styles.gate, { backgroundColor: colors.background, paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}>
      <View style={[styles.gateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="compass" size={30} color={colors.primary} />
        <Text style={[styles.gateTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.gateBody, { color: colors.foreground }]}>{body}</Text>
        {onLink ? (
          <Pressable testID={`${testID}-privacy-link`} onPress={onLink}>
            <Text style={[styles.gateLink, { color: colors.primary }]}>Privacy Policy</Text>
          </Pressable>
        ) : null}
        {note ? <Text style={[styles.gateNote, { color: colors.mutedForeground }]}>{note}</Text> : null}
        {onToggle ? (
          <Pressable testID={`${testID}-checkbox`} accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(checked) }} onPress={onToggle} style={styles.gateConsent}>
            <Feather name={checked ? 'check-square' : 'square'} size={22} color={colors.primary} />
            <Text style={[styles.gateConsentText, { color: colors.foreground }]}>I understand and agree.</Text>
          </Pressable>
        ) : null}
        {error ? <Text style={[styles.deleteError, { color: colors.destructive }]}>{error}</Text> : null}
        <Pressable
          testID={testID}
          disabled={isPending || (checked !== undefined && !checked)}
          onPress={() => onAction().catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to continue.'))}
          style={[styles.gateButton, { backgroundColor: colors.primary, opacity: isPending || (checked !== undefined && !checked) ? 0.5 : 1 }]}
        >
          {isPending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.gateButtonText, { color: colors.primaryForeground }]}>{actionLabel}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 },
  loadingText: { fontFamily: 'Poppins_400Regular', fontSize: 13 },
  gate: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  gateCard: { borderWidth: 1, borderRadius: 24, padding: 24, gap: 16 },
  gateTitle: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 30, lineHeight: 36 },
  gateBody: { fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 24 },
  gateNote: { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18 },
  gateLink: { fontFamily: 'Poppins_500Medium', fontSize: 13 },
  gateConsent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gateConsentText: { fontFamily: 'Poppins_500Medium', fontSize: 13 },
  gateButton: { minHeight: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  gateButtonText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  errorTitle: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 24 },
  retry: { borderRadius: 24, paddingHorizontal: 22, paddingVertical: 12 },
  buttonLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  listContent: { paddingBottom: 16 },
  stageHero: { padding: 22, paddingBottom: 20 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stageNumber: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, letterSpacing: 2, opacity: 0.7 },
  stageTitle: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 38, lineHeight: 43, marginTop: 8 },
  stageSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 15, opacity: 0.8 },
  discoveriesButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16 },
  discoveriesText: { fontFamily: 'Poppins_500Medium', fontSize: 12 },
  iconButton: { padding: 8 },
  progressRow: { flexDirection: 'row', gap: 9, marginTop: 22 },
  progressDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1 },
  teachingCard: { margin: 16, marginBottom: 8, padding: 18, borderRadius: 20, borderWidth: 1 },
  belief: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 21, marginBottom: 8 },
  teaching: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22 },
  promptSection: { paddingHorizontal: 16, paddingTop: 12, gap: 9 },
  sectionLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, letterSpacing: 1.8, marginBottom: 3 },
  prompt: { borderWidth: 1, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  promptText: { fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 19 },
  promptDesc: { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18 },
  emptyState: { alignItems: 'center', padding: 28 },
  emptyTitle: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 21, marginTop: 10 },
  emptyCopy: { fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 5 },
  beginButton: { marginTop: 14, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  beginLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  purposeCard: { marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 20, borderWidth: 1, gap: 9 },
  purposeOption: { borderRadius: 14, borderWidth: 1, padding: 13 },
  purposeInput: { minHeight: 86, borderWidth: 1, borderRadius: 14, padding: 13, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 21, textAlignVertical: 'top' },
  completionCard: { margin: 16, borderRadius: 22, padding: 20, alignItems: 'center' },
  completionTitle: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 23, marginTop: 8 },
  completionCopy: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  message: { maxWidth: '84%', marginHorizontal: 16, marginVertical: 5, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 12 },
  messageText: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 21 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16 },
  inlineError: { fontFamily: 'Poppins_400Regular', fontSize: 12, paddingHorizontal: 18, paddingVertical: 4 },
  composer: { borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  chatInput: { flex: 1, minHeight: 46, maxHeight: 110, borderWidth: 1, borderRadius: 23, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 10, fontFamily: 'Poppins_400Regular', fontSize: 14 },
  sendButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  nextButton: { width: 36, height: 46, alignItems: 'center', justifyContent: 'center' },
  settings: { flex: 1, paddingHorizontal: 20, gap: 12 },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingsTitle: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 30 },
  settingsCopy: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22, marginBottom: 14 },
  settingsLinks: { gap: 2, marginBottom: 8 },
  settingsLink: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  passwordInput: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontFamily: 'Poppins_400Regular' },
  deleteError: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 19 },
  settingsAction: { minHeight: 58, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  actionText: { fontFamily: 'Poppins_500Medium', fontSize: 14 },
  reviewOverlay: { flex: 1 },
  reviewHeader: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  reviewTitle: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 24 },
  reviewFooter: { padding: 20, borderTopWidth: 1 },
  reviewPrimaryBtn: { padding: 18, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  reviewPrimaryBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
});