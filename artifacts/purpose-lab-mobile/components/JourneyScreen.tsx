import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import * as Haptics from 'expo-haptics';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getGetCurrentJourneyQueryKey,
  useGetCurrentJourney,
  useRestartJourney,
  useUpdateJourney,
  useExtractJourneyDiscoveries,
  useUpdateStoryCard,
  useDeleteStoryCard,
  useUpdatePurposeTheme,
  useDeletePurposeTheme,
  type ChatMessage as ApiChatMessage,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { STAGES, STORY_PROMPTS } from '@/constants/journey';
import { streamJourneyChat, type ChatMessage } from '@/lib/mobile-api';
import { useAuth } from '@/providers/AuthProvider';
import { useColors } from '@/hooks/useColors';
import { MyDiscoveries } from './MyDiscoveries';
import { JourneySummary } from './JourneySummary';
import { StoryCardView, ThemeCardView, SeasonFormView, ActionPlanFormView } from './Discoveries';

function messageKey(message: ChatMessage, index: number) {
  return `${message.role}-${index}-${message.content.slice(0, 16)}`;
}

function extractPurposeOptions(messages: ChatMessage[]): string[] {
  const allText = messages
    .filter((message) => message.role === 'assistant')
    .map((message) => message.content)
    .join('\n');
  const options: string[] = [];
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

export function JourneyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { signOut, deleteAccount } = useAuth();
  const journeyQuery = useGetCurrentJourney();
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
  const inputRef = useRef<TextInput>(null);

  const journey = journeyQuery.data;
  const stageIdx = visibleStage ?? journey?.currentStageIdx ?? 0;
  const stage = STAGES[stageIdx];
  const promptSelection = selectedPrompts ?? journey?.selectedPrompts ?? [];
  const serverMessages = (journey?.messages?.[stage.id] ?? []) as ApiChatMessage[];
  const messages = localMessages[stage.id] ?? serverMessages;
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);
  const isHistorical = stageIdx < (journey?.currentStageIdx ?? 0);
  const isComplete = journey?.status === 'complete';
  const purposeValue = purposeDraft ?? journey?.purposeStatement ?? '';
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
  }, [journey?.id]);

  function togglePrompt(id: string) {
    if (promptSelection.includes(id)) {
      setSelectedPrompts(promptSelection.filter((item) => item !== id));
    } else {
      setSelectedPrompts([...promptSelection, id]);
    }
  }

  async function send() {
    const text = draft.trim();
    if (!text || !journey || isStreaming || isHistorical || isComplete) return;
    const previous = [...messages];
    const nextMessages: ChatMessage[] = [...previous, { role: 'user', content: text }];
    setLocalMessages((current) => ({ ...current, [stage.id]: nextMessages }));
    setDraft('');
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
      await queryClient.invalidateQueries({ queryKey: getGetCurrentJourneyQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setStreamError(error instanceof Error ? error.message : 'Unable to reach your guide.');
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
        ? "I'm ready for Stage 2. Please reflect back the patterns and themes you noticed in my stories, and ask me to confirm or refine them."
        : stageIdx === 2
        ? "I'm ready for Stage 3. Based on my confirmed themes and stories, please generate exactly 3 purpose statement options."
        : stageIdx === 3
        ? "I'm ready for Stage 4. Please begin by asking about my current season of life and roles."
        : stageIdx === 4
        ? "I'm ready for Stage 5. Please introduce the Start / Stop / Continue framework and ask the first question."
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
      await queryClient.invalidateQueries({ queryKey: getGetCurrentJourneyQueryKey() });
    } catch (error) {
      setStreamError(error instanceof Error ? error.message : 'Unable to begin this stage.');
    } finally {
      setIsStreaming(false);
    }
  }

  async function beginStage0() {
    if (!journey || stageIdx !== 0 || messages.length > 0 || isHistorical || isComplete) return;
    if (promptSelection.length < 2) {
      setStreamError('Choose at least two story prompts to begin.');
      return;
    }
    const promptLabels = promptSelection
      .map((id) => STORY_PROMPTS.find((p) => p.id === id)?.label ?? id)
      .join(', ');
    const openingPrompt = `The person has chosen to share stories around these themes: ${promptLabels}. Please warmly welcome them to Stage 1: Reveal — Your Story. Acknowledge the themes they chose, then gently invite them to begin with whichever one feels most natural right now. Ask one open, warm question to get them started. Keep your opening under 100 words.`;

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
      await queryClient.invalidateQueries({ queryKey: getGetCurrentJourneyQueryKey() });
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
      await extractDiscoveries.mutateAsync({ id: journey.id, stage: stageId as "reveal" | "identify" | "personalize" | "live" });
      await queryClient.invalidateQueries({ queryKey: getGetCurrentJourneyQueryKey() });
    } catch (error) {
      setExtractionFailed(true);
    } finally {
      setIsExtracting(false);
    }
  }

  async function completeReviewAndContinue() {
    if (!journey) return;
    setReviewStageId(null);
    setExtractionFailed(false);
    await moveToNextStage();
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
        purposeStatement: purposeValue.trim() || null,
        status: stageIdx === 5 ? 'complete' : 'in_progress',
      },
    });
    if (stageIdx === 5) {
      queryClient.setQueryData(getGetCurrentJourneyQueryKey(), {
        ...journey,
        ...updated,
        messages: {
          ...journey.messages,
          [stage.id]: localMessages[stage.id] ?? journey.messages[stage.id],
        },
      });
      setVisibleStage(5);
    } else {
      await queryClient.invalidateQueries({ queryKey: getGetCurrentJourneyQueryKey() });
      setVisibleStage(nextStage);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function continueStage() {
    if (!journey) return;
    if (isHistorical) {
      setVisibleStage(journey.currentStageIdx);
      return;
    }
    if (messages.length === 0) {
      setStreamError('Begin this stage with your guide before continuing.');
      return;
    }
    if (stageIdx === 2 && !purposeValue.trim()) {
      setStreamError('Choose or write the purpose statement that feels most true.');
      return;
    }

    if (['reveal', 'identify', 'personalize', 'live'].includes(stage.id)) {
      setReviewStageId(stage.id);
      runExtraction(stage.id);
      return;
    }

    await moveToNextStage();
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

  async function restart() {
    if (!journey) return;
    const next = await restartJourney.mutateAsync({ id: journey.id });
    queryClient.setQueryData(getGetCurrentJourneyQueryKey(), next);
    setLocalMessages({});
    setSelectedPrompts([]);
    setPurposeDraft(null);
    setVisibleStage(0);
    setShowSettings(false);
    setShowDiscoveries(false);
    setReviewStageId(null);
  }

  if (journeyQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Opening your journey…</Text>
      </View>
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
        <MyDiscoveries
          isOpen={showDiscoveries}
          onClose={() => setShowDiscoveries(false)}
          storyCards={journey?.storyCards ?? []}
          themes={journey?.themes ?? []}
          season={journey?.season ?? null}
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
              disabled={index > journey.currentStageIdx}
              onPress={() => setVisibleStage(index)}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= journey.currentStageIdx ? colors.accent : 'transparent',
                  borderColor: stage.textColor,
                  opacity: index <= journey.currentStageIdx ? 1 : 0.4,
                },
              ]}
            />
          ))}
        </View>
      </View>
      <View style={[styles.teachingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.belief, { color: colors.primary }]}>{stage.belief}</Text>
        <Text style={[styles.teaching, { color: colors.foreground }]}>{stage.teaching}</Text>
      </View>
      {stageIdx === 0 && messages.length === 0 ? (
        <View style={styles.promptSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHOOSE AT LEAST 2 THREADS</Text>
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
              disabled={isStreaming || promptSelection.length < 2}
              onPress={beginStage0}
              style={[styles.beginButton, { backgroundColor: colors.secondary, opacity: promptSelection.length < 2 ? 0.5 : 1 }]}
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
              onPress={() => setPurposeDraft(option)}
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
            onChangeText={setPurposeDraft}
            placeholder="I am someone who…, so others can…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.purposeInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input }]}
          />
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
                <Pressable testID="continue-anyway" onPress={completeReviewAndContinue} style={[styles.retry, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.buttonLabel, { color: colors.secondaryForeground }]}>Continue anyway</Text>
                </Pressable>
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
                    {journey?.storyCards?.map((card) => (
                      <StoryCardView
                        key={card.id}
                        card={card}
                        onUpdate={(c) => updateStoryCard.mutateAsync(c)}
                        onDelete={() => card.id && deleteStoryCard.mutateAsync({ id: card.id })}
                      />
                    ))}
                  </View>
                ) : null}

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

                {reviewStageId === 'personalize' && journey?.season ? (
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
                <Pressable testID="complete-review" onPress={completeReviewAndContinue} style={[styles.reviewPrimaryBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.reviewPrimaryBtnText, { color: colors.primaryForeground }]}>This feels right — continue</Text>
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
      {isComplete ? null : (
        <View style={[styles.composer, { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 8) }]}>
          <TextInput
            ref={inputRef}
            testID="chat-input"
            value={draft}
            onChangeText={setDraft}
            placeholder={stage.placeholder}
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={4000}
            blurOnSubmit={false}
            editable={!isHistorical && !isComplete}
            style={[styles.chatInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input, opacity: isHistorical || isComplete ? 0.55 : 1 }]}
          />
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
            disabled={updateJourney.isPending || isComplete}
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
        actionPlan={journey?.actionPlan ?? null}
        purposeStatement={journey?.purposeStatement ?? null}
        onUpdateStoryCard={(card) => updateStoryCard.mutateAsync(card)}
        onDeleteStoryCard={(id) => deleteStoryCard.mutateAsync({ id })}
        onUpdateTheme={(theme) => updatePurposeTheme.mutateAsync(theme)}
        onDeleteTheme={(id) => deletePurposeTheme.mutateAsync({ id })}
        onUpdateSeason={(s) => { if (journey) updateJourney.mutateAsync({ id: journey.id, data: { season: s } }); }}
        onUpdateActionPlan={(ap) => { if (journey) updateJourney.mutateAsync({ id: journey.id, data: { actionPlan: ap } }); }}
      />

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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 },
  loadingText: { fontFamily: 'Poppins_400Regular', fontSize: 13 },
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