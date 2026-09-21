import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import type { StoryCard, PurposeTheme, Season, ActionPlan } from '@workspace/api-client-react';

interface JourneySummaryProps {
  storyCards: StoryCard[];
  themes: PurposeTheme[];
  season: Season | null;
  actionPlan: ActionPlan | null;
  purposeStatement: string | null;
  onReset: () => void;
  onOpenDiscoveries: () => void;
}

export function JourneySummary({
  storyCards,
  themes,
  season,
  actionPlan,
  purposeStatement,
  onReset,
  onOpenDiscoveries,
}: JourneySummaryProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, {
        paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 67 : 0) + 24,
        paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 0) + 40,
      }]}
      testID="purpose-summary"
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>JOURNEY COMPLETE</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Your Purpose Summary</Text>
        <Pressable testID="discoveries-trigger" accessibilityLabel="My Discoveries" onPress={onOpenDiscoveries} style={styles.editBtn} hitSlop={12}>
          <Feather name="edit-3" size={16} color={colors.primary} />
          <Text style={[styles.editBtnText, { color: colors.primary }]}>My Discoveries</Text>
        </Pressable>
      </View>

      {purposeStatement ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PURPOSE STATEMENT</Text>
          <View style={[styles.card, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
            <Text style={[styles.purposeText, { color: colors.foreground }]}>{purposeStatement}</Text>
          </View>
        </View>
      ) : null}

      {themes.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>THEMES</Text>
          <View style={styles.themesGrid}>
            {themes.map((theme) => (
              <View key={theme.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.themeTitle, { color: colors.accent }]}>{theme.name}</Text>
                <Text style={[styles.themeDesc, { color: colors.foreground }]}>{theme.description}</Text>
                {theme.evidence && theme.evidence.length > 0 ? (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    {theme.evidence.map((ev, i) => (
                      <View key={i} style={[styles.evidence, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.evidenceText, { color: colors.foreground }]}><Text style={{ fontFamily: 'Poppins_600SemiBold' }}>{ev.storyTitle}:</Text> {ev.detail}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {storyCards.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>STORIES</Text>
          <View style={{ gap: 12 }}>
            {storyCards.map((card) => (
              <View key={card.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.storyTitle, { color: colors.primary }]}>{card.title}</Text>
                <Text style={[styles.storySummary, { color: colors.foreground }]}>{card.summary}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {season ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CURRENT SEASON</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.seasonSummary, { color: colors.foreground }]}>{season.summary}</Text>
            {season.expressions && season.expressions.length > 0 ? (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.subsectionTitle, { color: colors.accent }]}>Ways to live your purpose now</Text>
                <View style={{ gap: 6, marginTop: 8 }}>
                  {season.expressions.map((exp, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                      <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                      <Text style={[styles.bulletText, { color: colors.foreground }]}>{exp}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {actionPlan ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>NEXT STEPS</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {actionPlan.start && actionPlan.start.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.subsectionTitle, { color: colors.foreground }]}>Start</Text>
                {actionPlan.start.map((s, i) => <Text key={i} style={[styles.stepText, { color: colors.mutedForeground }]}>• {s}</Text>)}
              </View>
            )}
            {actionPlan.stop && actionPlan.stop.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.subsectionTitle, { color: colors.foreground }]}>Stop</Text>
                {actionPlan.stop.map((s, i) => <Text key={i} style={[styles.stepText, { color: colors.mutedForeground }]}>• {s}</Text>)}
              </View>
            )}
            {actionPlan.continue && actionPlan.continue.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.subsectionTitle, { color: colors.foreground }]}>Continue</Text>
                {actionPlan.continue.map((s, i) => <Text key={i} style={[styles.stepText, { color: colors.mutedForeground }]}>• {s}</Text>)}
              </View>
            )}
            {actionPlan.oneStepThisWeek ? (
              <View style={[styles.oneStep, { backgroundColor: 'rgba(200, 169, 106, 0.15)', borderColor: '#C8A96A' }]}>
                <Text style={[styles.subsectionTitle, { color: '#C8A96A' }]}>One Step This Week</Text>
                <Text style={[styles.stepText, { color: colors.foreground, marginTop: 4, fontFamily: 'Poppins_500Medium' }]}>{actionPlan.oneStepThisWeek}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={[styles.closingLine, { color: colors.primary }]}>What's within you creates a ripple.</Text>
        <Pressable testID="restart-journey" onPress={onReset} style={[styles.resetBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.resetBtnText, { color: colors.primaryForeground }]}>Begin a New Journey</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { marginBottom: 32 },
  eyebrow: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, letterSpacing: 2, marginBottom: 4 },
  title: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 32, lineHeight: 40 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  editBtnText: { fontFamily: 'Poppins_500Medium', fontSize: 14 },
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, letterSpacing: 1.5, marginBottom: 12 },
  card: { padding: 20, borderRadius: 16, borderWidth: 1 },
  purposeText: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 24, lineHeight: 34, textAlign: 'center' },
  themesGrid: { gap: 12 },
  themeTitle: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 20, marginBottom: 4 },
  themeDesc: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22 },
  evidence: { padding: 12, borderRadius: 8 },
  evidenceText: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20 },
  storyTitle: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 18, marginBottom: 4 },
  storySummary: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22 },
  seasonSummary: { fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 24 },
  subsectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, letterSpacing: 1 },
  bullet: { fontSize: 16 },
  bulletText: { fontFamily: 'Poppins_400Regular', fontSize: 14, flex: 1 },
  stepText: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 24 },
  oneStep: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  footer: { alignItems: 'center', paddingVertical: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  closingLine: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 24, textAlign: 'center', marginBottom: 24 },
  resetBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24 },
  resetBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
});
