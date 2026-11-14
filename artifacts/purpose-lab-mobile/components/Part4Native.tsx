import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranscribeRecording, type PatternDiscovery, type StoryCard } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

type Colors = ReturnType<typeof useColors>;
const MAX_SECONDS = 300;
const MAX_BYTES = 12 * 1024 * 1024;

/* ---------------- Voice recording ---------------- */

async function readBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = String(reader.result ?? '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(blob);
    });
  }
  return await new File(uri).base64();
}

function deleteRecording(uri: string | null) {
  if (!uri) return;
  if (Platform.OS === 'web') {
    try { URL.revokeObjectURL(uri); } catch { /* ignore */ }
    return;
  }
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch { /* ignore */ }
}

export function useVoiceTranscription(onTranscript: (text: string) => void) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const transcribe = useTranscribeRecording();
  const [state, setState] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const discard = useRef(false);
  const mounted = useRef(true);
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;
  const mutateRef = useRef(transcribe.mutateAsync);
  mutateRef.current = transcribe.mutateAsync;
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (tick.current) clearInterval(tick.current);
      try {
        if (recorder.isRecording) {
          void recorder.stop().then(() => deleteRecording(recorder.uri)).catch(() => undefined);
        }
      } catch { /* ignore */ }
    };
  }, [recorder]);

  async function start() {
    setError('');
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError('Microphone access is off. You can turn it on in Settings, or keep typing. Typing always works.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      discard.current = false;
      setSeconds(0);
      setState('recording');
      tick.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) setTimeout(() => stopRef.current(), 0);
          return s + 1;
        });
      }, 1000);
    } catch {
      setError('The microphone could not start. You can keep typing.');
      setState('idle');
    }
  }

  async function stop() {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    } catch {
      setState('idle');
      setError('Recording stopped unexpectedly. Try again or type.');
      return;
    }
    if (discard.current || !uri) {
      deleteRecording(uri);
      discard.current = false;
      setState('idle');
      return;
    }
    setState('transcribing');
    try {
      const audio = await readBase64(uri);
      if (audio.length * 0.75 > MAX_BYTES) {
        setError('That recording is too long to convert. Try a shorter one, or type.');
        return;
      }
      const result = await mutateRef.current({ data: { audio } });
      const text = (result.text ?? '').trim();
      if (text && mounted.current) cbRef.current(text);
      else setError("We couldn't hear any words. Try again or type instead.");
    } catch {
      setError("We couldn't convert that recording. Try again or type.");
    } finally {
      deleteRecording(uri);
      if (mounted.current) setState('idle');
    }
  }
  stopRef.current = () => void stop();

  function cancel() {
    discard.current = true;
    void stop();
  }

  return { state, seconds, error, clearError: () => setError(''), start, stop, cancel };
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function RecordingBar({ seconds, onCancel, colors }: { seconds: number; onCancel: () => void; colors: Colors }) {
  return (
    <View testID="status-recording" style={[s.recBar, { borderColor: colors.input, backgroundColor: colors.card }]}>
      <View style={[s.recDot, { backgroundColor: colors.destructive }]} />
      <Text style={[s.body, { color: colors.foreground, flex: 1 }]}>Listening {fmt(seconds)} / 5:00</Text>
      <Pressable onPress={onCancel} testID="button-cancel-recording" hitSlop={8}>
        <Text style={[s.link, { color: colors.mutedForeground }]}>Cancel</Text>
      </Pressable>
    </View>
  );
}

export function TranscriptPreview({
  value,
  busy,
  onChange,
  onUse,
  onDiscard,
  colors,
}: {
  value: string;
  busy: boolean;
  onChange: (v: string) => void;
  onUse: () => void;
  onDiscard: () => void;
  colors: Colors;
}) {
  return (
    <View testID="transcript-preview" style={[s.transcript, { borderColor: colors.accent, backgroundColor: colors.card }]}>
      <Text style={[s.label, { color: colors.mutedForeground }]}>
        {busy ? 'TURNING YOUR WORDS INTO TEXT' : 'YOUR WORDS. EDIT FREELY. NOTHING IS SENT YET.'}
      </Text>
      {busy && !value ? (
        <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 6 }} />
      ) : (
        <TextInput testID="input-transcript" value={value} onChangeText={onChange} multiline style={[s.body, { color: colors.foreground, maxHeight: 110 }]} />
      )}
      <View style={s.row}>
        <Pressable testID="button-discard-transcript" disabled={!value} onPress={onDiscard} style={[s.chip, { borderColor: colors.border, opacity: value ? 1 : 0.4 }]}>
          <Text style={[s.chipText, { color: colors.foreground }]}>Discard</Text>
        </Pressable>
        <Pressable testID="button-use-transcript" disabled={!value.trim()} onPress={onUse} style={[s.chip, { backgroundColor: colors.primary, borderColor: colors.primary, opacity: value.trim() ? 1 : 0.4 }]}>
          <Text style={[s.chipText, { color: colors.primaryForeground }]}>Move into my message</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ---------------- Reveal: story confirm card ---------------- */

const toLines = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean);

export function StoryConfirmCardNative({
  card,
  index,
  onSave,
  onDelete,
  colors,
}: {
  card: StoryCard;
  index: number;
  onSave: (data: { title?: string; summary?: string; feelings: string[]; actions: string[]; impact: string[]; confirmed: boolean }) => Promise<unknown>;
  onDelete: () => void;
  colors: Colors;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title ?? '');
  const [felt, setFelt] = useState((card.feelings ?? []).join('\n'));
  const [did, setDid] = useState((card.actions ?? []).join('\n'));
  const [changed, setChanged] = useState((card.impact ?? []).join('\n'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const confirmed = Boolean(card.confirmed);

  useEffect(() => {
    if (editing) return;
    setTitle(card.title ?? '');
    setFelt((card.feelings ?? []).join('\n'));
    setDid((card.actions ?? []).join('\n'));
    setChanged((card.impact ?? []).join('\n'));
  }, [card, editing]);

  async function persist(c: boolean) {
    setSaving(true);
    setError('');
    try {
      const summary = `What you felt\n${felt.trim()}\n\nWhat you did\n${did.trim()}\n\nWhat changed\n${changed.trim()}`;
      await onSave({ title: title.trim() || card.title, summary, feelings: toLines(felt), actions: toLines(did), impact: toLines(changed), confirmed: c });
      setEditing(false);
    } catch {
      setError("That didn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const sections: [string, string, (v: string) => void, string[]][] = [
    ['WHAT YOU FELT', felt, setFelt, card.feelings ?? []],
    ['WHAT YOU DID', did, setDid, card.actions ?? []],
    ['WHAT CHANGED', changed, setChanged, card.impact ?? []],
  ];

  return (
    <View testID={`card-story-${card.id}`} style={[s.card, { backgroundColor: colors.card, borderColor: confirmed ? colors.accent : colors.border }]}>
      <View style={s.rowBetween}>
        <Text style={[s.label, { color: colors.mutedForeground }]}>STORY {index + 1}</Text>
        <Text style={[s.badge, { color: confirmed ? colors.accentForeground : colors.mutedForeground, backgroundColor: confirmed ? colors.accent : 'transparent', borderColor: confirmed ? colors.accent : colors.border }]}>
          {confirmed ? 'Confirmed' : 'Not yet confirmed'}
        </Text>
      </View>
      {editing ? (
        <TextInput value={title} onChangeText={setTitle} style={[s.title, s.input, { color: colors.foreground, borderColor: colors.input }]} />
      ) : (
        <Text style={[s.title, { color: colors.foreground }]}>{card.title}</Text>
      )}
      {sections.map(([label, value, set, list]) => (
        <View key={label} style={{ marginTop: 10 }}>
          <Text style={[s.label, { color: colors.primary }]}>{label}</Text>
          {editing ? (
            <TextInput value={value} onChangeText={set} multiline placeholder="One per line" placeholderTextColor={colors.mutedForeground} style={[s.body, s.input, { color: colors.foreground, borderColor: colors.input, minHeight: 64 }]} />
          ) : (
            <Text style={[s.body, { color: list.length ? colors.foreground : colors.mutedForeground }]}>{list.length ? list.join('\n') : 'Nothing noted yet'}</Text>
          )}
        </View>
      ))}
      {error ? <Text style={[s.body, { color: colors.destructive, marginTop: 6 }]}>{error}</Text> : null}
      <View style={[s.row, { marginTop: 14, flexWrap: 'wrap' }]}>
        {editing ? (
          <>
            <Pressable onPress={() => setEditing(false)} style={[s.chip, { borderColor: colors.border }]}><Text style={[s.chipText, { color: colors.foreground }]}>Cancel</Text></Pressable>
            <Pressable testID={`button-save-story-${card.id}`} disabled={saving} onPress={() => persist(false)} style={[s.chip, { borderColor: colors.primary }]}><Text style={[s.chipText, { color: colors.primary }]}>Save edits</Text></Pressable>
            <Pressable testID={`button-save-confirm-story-${card.id}`} disabled={saving} onPress={() => persist(true)} style={[s.chip, { backgroundColor: colors.primary, borderColor: colors.primary }]}><Text style={[s.chipText, { color: colors.primaryForeground }]}>Save and confirm</Text></Pressable>
          </>
        ) : (
          <>
            <Pressable testID={`button-edit-story-${card.id}`} onPress={() => setEditing(true)} style={[s.chip, { borderColor: colors.border }]}><Text style={[s.chipText, { color: colors.foreground }]}>Edit</Text></Pressable>
            <Pressable testID={`button-delete-story-${card.id}`} onPress={onDelete} style={[s.chip, { borderColor: 'transparent' }]}><Text style={[s.chipText, { color: colors.mutedForeground }]}>Remove</Text></Pressable>
            {confirmed ? (
              <Pressable testID={`button-unconfirm-story-${card.id}`} disabled={saving} onPress={() => persist(false)} style={[s.chip, { borderColor: 'transparent' }]}><Text style={[s.chipText, { color: colors.mutedForeground }]}>Undo confirm</Text></Pressable>
            ) : (
              <Pressable testID={`button-confirm-story-${card.id}`} disabled={saving} onPress={() => persist(true)} style={[s.chip, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                <Text style={[s.chipText, { color: colors.primaryForeground }]}>{saving ? 'Saving' : 'Yes, that sounds right'}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
}

/* ---------------- Identify ---------------- */

export function RevealSummariesNative({ cards, colors }: { cards: StoryCard[]; colors: Colors }) {
  const confirmed = cards.filter((c) => c.confirmed);
  const shown = confirmed.length ? confirmed : cards;
  if (!shown.length) return null;
  return (
    <View testID="reveal-summaries" style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginTop: 10 }]}>
      <Text style={[s.label, { color: colors.mutedForeground }]}>YOUR REVEAL SUMMARIES</Text>
      {shown.map((c) => (
        <View key={c.id} style={[s.summary, { borderLeftColor: colors.accent }]}>
          <Text style={[s.bodyStrong, { color: colors.foreground }]}>{c.title}</Text>
          <Text style={[s.small, { color: colors.mutedForeground }]}>Felt: {(c.feelings ?? []).join(', ') || 'Not noted'}</Text>
          <Text style={[s.small, { color: colors.mutedForeground }]}>Did: {(c.actions ?? []).join(', ') || 'Not noted'}</Text>
          <Text style={[s.small, { color: colors.mutedForeground }]}>Changed: {(c.impact ?? []).join(', ') || 'Not noted'}</Text>
        </View>
      ))}
    </View>
  );
}

const toWords = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 10);

export function PatternFormNative({ value, onSave, colors }: { value: PatternDiscovery | null; onSave: (next: PatternDiscovery) => Promise<unknown>; colors: Colors }) {
  const [actionWords, setActionWords] = useState((value?.actionWords ?? []).join(', '));
  const [adjectives, setAdjectives] = useState((value?.adjectives ?? []).join(', '));
  const [impact, setImpact] = useState(value?.impact ?? '');
  const [equal, setEqual] = useState(Boolean(value?.confirmed));
  const [season, setSeason] = useState(Boolean(value?.confirmed));
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const canConfirm = toWords(actionWords).length > 0 && impact.trim().length > 0 && equal && season;

  async function save(confirmed: boolean) {
    setSaving(true);
    setNote('');
    try {
      await onSave({ actionWords: toWords(actionWords), adjectives: toWords(adjectives), impact: impact.trim().slice(0, 2000), confirmed });
      setNote(confirmed ? 'Confirmed and saved.' : 'Saved. Confirm when it feels true.');
    } catch {
      setNote("That didn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const check = (on: boolean, set: (v: boolean) => void, label: string, id: string) => (
    <Pressable testID={id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => set(!on)} style={s.checkRow}>
      <Feather name={on ? 'check-square' : 'square'} size={20} color={colors.primary} />
      <Text style={[s.body, { color: colors.foreground, flex: 1 }]}>{label}</Text>
    </Pressable>
  );

  return (
    <View testID="form-pattern-discovery" style={[s.card, { backgroundColor: colors.secondary, borderColor: value?.confirmed ? colors.accent : colors.border, marginHorizontal: 16, marginTop: 12 }]}>
      <Text style={[s.label, { color: colors.mutedForeground }]}>IN YOUR OWN WORDS</Text>
      <Text style={[s.title, { color: colors.foreground }]}>What you do, and what it changes</Text>
      <Text style={[s.small, { color: colors.mutedForeground, marginBottom: 6 }]}>Action and impact carry equal weight. Your verb does not need to be unique.</Text>
      <Text style={[s.small, { color: colors.foreground }]}>Action word(s), comma separated</Text>
      <TextInput testID="input-action-words" value={actionWords} onChangeText={setActionWords} placeholder="encourage, build" placeholderTextColor={colors.mutedForeground} style={[s.body, s.input, { color: colors.foreground, borderColor: colors.input, backgroundColor: colors.card }]} />
      <Text style={[s.small, { color: colors.foreground, marginTop: 8 }]}>How you do it (optional)</Text>
      <TextInput testID="input-adjectives" value={adjectives} onChangeText={setAdjectives} placeholder="quietly, patiently" placeholderTextColor={colors.mutedForeground} style={[s.body, s.input, { color: colors.foreground, borderColor: colors.input, backgroundColor: colors.card }]} />
      <Text style={[s.small, { color: colors.foreground, marginTop: 8 }]}>Impact: what changes in other people</Text>
      <TextInput testID="input-impact" value={impact} onChangeText={setImpact} multiline maxLength={2000} placeholder="People feel brave enough to try again." placeholderTextColor={colors.mutedForeground} style={[s.body, s.input, { color: colors.foreground, borderColor: colors.input, backgroundColor: colors.card, minHeight: 70 }]} />
      {check(equal, setEqual, 'Both my action and its impact on others are named here.', 'checkbox-equal-weight')}
      {check(season, setSeason, 'This would be true of me at home, at work, with friends, in any season.', 'checkbox-any-season')}
      <View style={[s.row, { marginTop: 10, flexWrap: 'wrap' }]}>
        <Pressable testID="button-save-pattern" disabled={saving} onPress={() => save(false)} style={[s.chip, { borderColor: colors.primary }]}>
          <Text style={[s.chipText, { color: colors.primary }]}>Save without confirming</Text>
        </Pressable>
        <Pressable testID="button-confirm-pattern" disabled={saving || !canConfirm} onPress={() => save(true)} style={[s.chip, { backgroundColor: colors.primary, borderColor: colors.primary, opacity: canConfirm ? 1 : 0.4 }]}>
          <Text style={[s.chipText, { color: colors.primaryForeground }]}>{value?.confirmed ? 'Update, keep confirmed' : 'This rings true. Confirm'}</Text>
        </Pressable>
      </View>
      {note ? <Text style={[s.small, { color: colors.mutedForeground, marginTop: 6 }]}>{note}</Text> : null}
    </View>
  );
}

export function PatternSummaryNative({ value, colors }: { value: PatternDiscovery | null | undefined; colors: Colors }) {
  if (!value?.confirmed) {
    return (
      <View testID="pattern-summary-empty" style={[s.card, { borderColor: colors.border, borderStyle: 'dashed', marginHorizontal: 16, marginTop: 10 }]}>
        <Text style={[s.small, { color: colors.mutedForeground }]}>Your action and impact from Identify aren't confirmed yet. You can name them here with your guide.</Text>
      </View>
    );
  }
  return (
    <View testID="pattern-summary" style={[s.card, { backgroundColor: colors.card, borderColor: colors.accent, marginHorizontal: 16, marginTop: 10, gap: 8 }]}>
      <Text style={[s.label, { color: colors.primary }]}>YOUR ACTION</Text>
      <Text style={[s.title, { color: colors.foreground }]}>{value.actionWords.join(', ')}</Text>
      {value.adjectives.length ? <Text style={[s.small, { color: colors.mutedForeground }]}>{value.adjectives.join(', ')}</Text> : null}
      <Text style={[s.label, { color: colors.primary, marginTop: 4 }]}>YOUR IMPACT</Text>
      <Text style={[s.body, { color: colors.foreground }]}>{value.impact}</Text>
    </View>
  );
}

/* ---------------- Purpose page ---------------- */

export function PurposePageModal({
  visible,
  statement,
  pattern,
  onClose,
}: {
  visible: boolean;
  statement: string;
  pattern: PatternDiscovery | null | undefined;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const [shareError, setShareError] = useState('');

  async function shareText() {
    setShareError('');
    const parts = ['MY PURPOSE', '', statement, ''];
    if (pattern?.confirmed) parts.push(`Action: ${pattern.actionWords.join(', ')}`, `Impact: ${pattern.impact}`, '');
    parts.push(`Ripple Labs Purpose Lab, ${date}`);
    try {
      await Share.share({ message: parts.join('\n'), title: 'My purpose' });
    } catch {
      setShareError('Sharing is not available here. You can take a screenshot of this page instead.');
    }
  }

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 67 : 0), paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 0) }}>
        <View style={[s.row, { justifyContent: 'flex-end', padding: 12 }]}>
          <Pressable testID="button-share-purpose" onPress={shareText} style={[s.chip, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <Text style={[s.chipText, { color: colors.primaryForeground }]}>Share as text</Text>
          </Pressable>
          <Pressable testID="button-close-purpose-page" onPress={onClose} style={[s.chip, { borderColor: colors.border }]}>
            <Text style={[s.chipText, { color: colors.foreground }]}>Close</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={[s.label, { color: colors.primary, letterSpacing: 4 }]}>MY PURPOSE</Text>
          <View style={[s.rule, { backgroundColor: colors.accent }]} />
          <Text testID="text-purpose-statement" style={[s.statement, { color: colors.foreground }]}>{statement}</Text>
          <View style={[s.rule, { backgroundColor: colors.accent }]} />
          {pattern?.confirmed ? (
            <View style={{ gap: 4, alignItems: 'center' }}>
              <Text style={[s.label, { color: colors.primary }]}>ACTION</Text>
              <Text style={[s.body, { color: colors.foreground, textAlign: 'center' }]}>{pattern.actionWords.join(', ')}</Text>
              <Text style={[s.label, { color: colors.primary, marginTop: 10 }]}>IMPACT</Text>
              <Text style={[s.body, { color: colors.foreground, textAlign: 'center' }]}>{pattern.impact}</Text>
            </View>
          ) : null}
          <Text style={[s.small, { color: colors.mutedForeground, marginTop: 36 }]}>Named in the Ripple Labs Purpose Lab · {date}</Text>
          <Text style={[s.small, { color: colors.mutedForeground, marginTop: 4 }]}>Laid out to screenshot cleanly.</Text>
          {shareError ? <Text style={[s.small, { color: colors.destructive, marginTop: 8 }]}>{shareError}</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ---------------- Practice ---------------- */

export const PRACTICE_SAMPLES = [
  {
    title: 'The Saturday garden',
    text: 'Last spring I organized our street to clear the empty lot on Saturdays. I made the sign-up sheet, brought coffee, and kept checking on the older neighbors. I felt awake and useful. By June, people who had never spoken were trading tomatoes and watching each other\'s kids.',
  },
  {
    title: 'The hard semester',
    text: 'When my sister was failing chemistry I sat with her every night for six weeks. I broke the problems into small steps and kept telling her she could do it. I felt patient and steady. She passed, and later told me it was the first time she believed she was smart.',
  },
];

export function PracticePanelNative({ onUseSample, colors }: { onUseSample: (text: string) => void; colors: Colors }) {
  const [open, setOpen] = useState(true);
  return (
    <View testID="practice-panel" style={[s.card, { borderColor: colors.accent, borderStyle: 'dashed', backgroundColor: colors.card, marginHorizontal: 16, marginTop: 10 }]}>
      <Pressable onPress={() => setOpen(!open)} style={s.rowBetween} testID="button-toggle-practice-help">
        <Text style={[s.label, { color: colors.primary }]}>PRACTICE NOTEBOOK</Text>
        <Text style={[s.small, { color: colors.mutedForeground }]}>{open ? 'Hide' : 'How to test'}</Text>
      </Pressable>
      {open ? (
        <View style={{ gap: 6, marginTop: 6 }}>
          <Text style={[s.small, { color: colors.foreground }]}>Separate from your own journey. Tap any stage dot to jump there. Try typing and the microphone.</Text>
          <Text style={[s.small, { color: colors.mutedForeground }]}>1. Reveal: choose a prompt, use a sample story, confirm two summaries.</Text>
          <Text style={[s.small, { color: colors.mutedForeground }]}>2. Identify: say what you notice, then confirm action and impact.</Text>
          <Text style={[s.small, { color: colors.mutedForeground }]}>3. Pinpoint: draft, answer the why, read it aloud, save, open the purpose page.</Text>
          <View style={[s.row, { flexWrap: 'wrap' }]}>
            {PRACTICE_SAMPLES.map((p) => (
              <Pressable key={p.title} testID={`button-sample-${p.title.replace(/\s+/g, '-').toLowerCase()}`} onPress={() => onUseSample(p.text)} style={[s.chip, { borderColor: colors.primary }]}>
                <Text style={[s.chipText, { color: colors.primary }]}>Use sample: {p.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, letterSpacing: 1.6 },
  body: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 21 },
  bodyStrong: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, lineHeight: 21 },
  small: { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18 },
  link: { fontFamily: 'Poppins_500Medium', fontSize: 12, textDecorationLine: 'underline' },
  title: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 20, marginTop: 4 },
  statement: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 28, lineHeight: 40, textAlign: 'center' },
  rule: { width: 56, height: 1, marginVertical: 24 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 },
  chipText: { fontFamily: 'Poppins_500Medium', fontSize: 12 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  badge: { fontFamily: 'Poppins_500Medium', fontSize: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  input: { borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 4, textAlignVertical: 'top' },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 10 },
  summary: { borderLeftWidth: 2, paddingLeft: 12, marginTop: 10, gap: 2 },
  recBar: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 23, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  recDot: { width: 10, height: 10, borderRadius: 5 },
  transcript: { marginHorizontal: 12, marginTop: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 12, gap: 6 },
});
