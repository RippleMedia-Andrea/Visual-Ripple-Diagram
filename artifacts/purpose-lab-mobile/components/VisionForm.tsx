import React, { useEffect, useState } from 'react';
import { Text, TextInput, Pressable, View } from 'react-native';
import type { Vision } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

export function VisionForm({ vision, onSave }: { vision: Vision; onSave: (vision: Vision) => Promise<void> }) {
  const colors = useColors();
  const [draft, setDraft] = useState(vision);
  const [status, setStatus] = useState('');
  useEffect(() => setDraft(vision), [vision]);
  const labels = { picture: 'The life I picture', influences: 'Where that picture came from', beforeStarting: 'What I thought I needed first' };
  return <View style={{ padding: 16, gap: 12, backgroundColor: colors.card, borderRadius: 16 }}>
    <Text style={{ color: colors.foreground, fontSize: 20 }}>Your Vision</Text>
    {(Object.keys(labels) as Array<keyof Vision>).map((key) => <View key={key}>
      <Text style={{ color: colors.foreground, marginBottom: 6 }}>{labels[key]}</Text>
      <TextInput accessibilityLabel={labels[key]} multiline value={draft[key]} onChangeText={(value) => { setDraft({ ...draft, [key]: value }); setStatus(''); }} style={{ color: colors.foreground, borderColor: colors.border, borderWidth: 1, padding: 12, borderRadius: 8, minHeight: 70 }} />
    </View>)}
    <Pressable disabled={status === 'Saving…'} accessibilityRole="button" onPress={async () => {
      setStatus('Saving…');
      try { await onSave(draft); setStatus('Saved'); } catch { setStatus('Unable to save. Please try again.'); }
    }} style={{ backgroundColor: colors.primary, padding: 12, borderRadius: 24 }}>
      <Text style={{ color: colors.primaryForeground, textAlign: 'center' }}>Save vision</Text>
    </Pressable>
    <Text accessibilityLiveRegion="polite" style={{ color: colors.foreground }}>{status}</Text>
  </View>;
}
