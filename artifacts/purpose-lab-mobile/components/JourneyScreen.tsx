import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
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
  type ChatMessage as ApiChatMessage,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { STAGES, STORY_PROMPTS } from '@/constants/journey';
import { streamJourneyChat, type ChatMessage } from '@/lib/mobile-api';
import { useAuth } from '@/providers/AuthProvider';
import { useColors } from '@/hooks/useColors';

function messageKey(message: ChatMessage, index: number) {
  return `${message.role}-${index}-${message.content.slice(0, 16)}`;
}

function extractPurposeOptions(messages: ChatMessage[]): string[] {
  const text = messages
    .filter((message) => message.role === 'assistant')
    .map((message) => message.content)
    .join('\n');
  const options: string[] = [];
  const pattern = /I am someone who[^\n"]+(?:so others can[^\n".]+)?/gi;
  for (const match of text.matchAll(pattern)) {
    const option = match[0].trim().replace(/[."”]+$/, '');
    if (!options.includes(option)) options.push(option);
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
  const [visibleStage, setVisibleStage] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState<Record<string, ChatMessage[]>>({});
  const [selectedPrompts, setSelectedPrompts] = useState<string[] | null>(null);
  const [purposeDraft, setPurposeDraft] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
  }, [journey?.id]);

  function togglePrompt(id: string) {
    if (promptSelection.includes(id)) {
      setSelectedPrompts(promptSelection.filter((item) => item !== id));
    } else if (promptSelection.length < 3) {
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
    const previousStage = STAGES[stageIdx - 1];
    const previousMessages = (localMessages[previousStage.id] ??
      journey.messages[previousStage.id] ??
      []) as ChatMessage[];
    const summary = previousMessages
      .map((message) => `${message.role === 'user' ? 'Person' : 'Guide'}: ${message.content}`)
      .join('\n\n');
    const openingPrompt =
      stageIdx === 2
        ? `Based on the prior conversation below, generate exactly 3 purpose statement options in the format "I am someone who [action], so others can [impact]." Label them Option 1, Option 2, and Option 3.\n\n${summary}`
        : `Begin Stage ${stage.number}: ${stage.title} — ${stage.subtitle}. Use the prior-stage conversation below and the saved purpose statement when available. Reflect one relevant thread, then ask one warm, focused question.\n\n${summary}`;
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

  async function continueStage() {
    if (!journey) return;
    if (isHistorical) {
      setVisibleStage(journey.currentStageIdx);
      return;
    }
    if (messages.length === 0) {
      setStreamError(stageIdx === 0 ? 'Share at least one reflection before continuing.' : 'Begin this stage with your guide before continuing.');
      return;
    }
    if (stageIdx === 0 && promptSelection.length < 2) {
      setStreamError('Choose at least two story prompts before continuing.');
      return;
    }
    if (stageIdx === 2 && !purposeValue.trim()) {
      setStreamError('Choose or write the purpose statement that feels most true.');
      return;
    }
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

  function confirmDelete() {
    Alert.alert(
      'Delete your account?',
      'Your account and saved Purpose Lab journey will be permanently deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => deleteAccount().catch((error: Error) => Alert.alert('Unable to delete', error.message)),
        },
      ],
    );
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

  const header = (
    <View>
      <View style={[styles.stageHero, { backgroundColor: stage.color }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.stageNumber, { color: stage.textColor }]}>{stage.number} / 06</Text>
            <Text style={[styles.stageTitle, { color: stage.textColor }]}>{stage.title}</Text>
            <Text style={[styles.stageSubtitle, { color: stage.textColor }]}>{stage.subtitle}</Text>
          </View>
          <Pressable
            testID="settings-button"
            accessibilityLabel="Account settings"
            onPress={() => setShowSettings(true)}
            style={styles.iconButton}
          >
            <Feather name="settings" size={22} color={stage.textColor} />
          </Pressable>
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
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHOOSE 2–3 THREADS</Text>
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
                <Text style={[styles.promptText, { color: colors.foreground }]}>{prompt.label}</Text>
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
      {isComplete ? (
        <View style={[styles.completionCard, { backgroundColor: colors.deepTeal }]}>
          <Feather name="check-circle" size={28} color={colors.accent} />
          <Text style={[styles.completionTitle, { color: colors.primaryForeground }]}>Your ripple continues</Text>
          <Text style={[styles.completionCopy, { color: colors.softAqua }]}>
            Your completed journey remains here whenever you want to revisit it. Begin a new one from account settings.
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.background }]} behavior="padding" keyboardVerticalOffset={0}>
      <View style={{ height: Math.max(insets.top, Platform.OS === 'web' ? 67 : 0), backgroundColor: stage.color }} />
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
      {streamError ? <Text style={[styles.inlineError, { color: colors.destructive }]}>{streamError}</Text> : null}
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
          <Pressable onPress={restart} style={[styles.settingsAction, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="refresh-ccw" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Begin a new journey</Text>
          </Pressable>
          <Pressable onPress={signOut} style={[styles.settingsAction, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="log-out" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Sign out</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable testID="delete-account" onPress={confirmDelete} style={[styles.settingsAction, { borderColor: colors.destructive }]}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
            <Text style={[styles.actionText, { color: colors.destructive }]}>Delete account permanently</Text>
          </Pressable>
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
  iconButton: { padding: 8 },
  progressRow: { flexDirection: 'row', gap: 9, marginTop: 22 },
  progressDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1 },
  teachingCard: { margin: 16, marginBottom: 8, padding: 18, borderRadius: 20, borderWidth: 1 },
  belief: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 21, marginBottom: 8 },
  teaching: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22 },
  promptSection: { paddingHorizontal: 16, paddingTop: 12, gap: 9 },
  sectionLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, letterSpacing: 1.8, marginBottom: 3 },
  prompt: { borderWidth: 1, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  promptText: { flex: 1, fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 19 },
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
  settingsAction: { minHeight: 58, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  actionText: { fontFamily: 'Poppins_500Medium', fontSize: 14 },
});