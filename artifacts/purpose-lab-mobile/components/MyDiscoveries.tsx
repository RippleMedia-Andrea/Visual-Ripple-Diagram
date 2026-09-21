import React from 'react';
import { View, Text, Pressable, ScrollView, Modal, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { StoryCardView, ThemeCardView, SeasonFormView, ActionPlanFormView } from './Discoveries';
import type { StoryCard, PurposeTheme, Season, ActionPlan } from '@workspace/api-client-react';

interface MyDiscoveriesProps {
  isOpen: boolean;
  onClose: () => void;
  storyCards: StoryCard[];
  themes: PurposeTheme[];
  season: Season | null;
  actionPlan: ActionPlan | null;
  purposeStatement: string | null;
  onUpdateStoryCard: (card: { id: number; data: any }) => void;
  onDeleteStoryCard: (id: number) => void;
  onUpdateTheme: (theme: { id: number; data: any }) => void;
  onDeleteTheme: (id: number) => void;
  onUpdateSeason: (season: Season) => void;
  onUpdateActionPlan: (plan: ActionPlan) => void;
}

export function MyDiscoveries({
  isOpen,
  onClose,
  storyCards,
  themes,
  season,
  actionPlan,
  purposeStatement,
  onUpdateStoryCard,
  onDeleteStoryCard,
  onUpdateTheme,
  onDeleteTheme,
  onUpdateSeason,
  onUpdateActionPlan,
}: MyDiscoveriesProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 67 : 0) }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]} testID="my-discoveries-sheet">
          <Text style={[styles.title, { color: colors.primary }]}>My Discoveries</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Feather name="x" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {purposeStatement ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PURPOSE STATEMENT</Text>
              <View style={[styles.purposeCard, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
                <Text style={[styles.purposeText, { color: colors.foreground }]}>{purposeStatement}</Text>
              </View>
            </View>
          ) : null}

          {themes.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PURPOSE THEMES</Text>
              {themes.map((theme) => (
                <ThemeCardView
                  key={theme.id}
                  theme={theme}
                  onUpdate={onUpdateTheme}
                  onDelete={() => theme.id && onDeleteTheme(theme.id)}
                />
              ))}
            </View>
          ) : null}

          {season ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CURRENT SEASON</Text>
              <SeasonFormView season={season} onUpdate={onUpdateSeason} />
            </View>
          ) : null}

          {actionPlan ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>NEXT STEPS</Text>
              <ActionPlanFormView actionPlan={actionPlan} onUpdate={onUpdateActionPlan} />
            </View>
          ) : null}

          {storyCards.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>STORY CARDS</Text>
              {storyCards.map((card) => (
                <StoryCardView
                  key={card.id}
                  card={card}
                  onUpdate={onUpdateStoryCard}
                  onDelete={() => card.id && onDeleteStoryCard(card.id)}
                />
              ))}
            </View>
          ) : null}

          {storyCards.length === 0 && themes.length === 0 && !season && !actionPlan && !purposeStatement ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nothing saved yet. Discoveries will appear here as you journey through the stages.
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 24 },
  closeBtn: { padding: 4 },
  content: { padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, letterSpacing: 1.5, marginBottom: 12 },
  purposeCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  purposeText: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 20, lineHeight: 28 },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 14, textAlign: 'center', marginTop: 40 },
});
