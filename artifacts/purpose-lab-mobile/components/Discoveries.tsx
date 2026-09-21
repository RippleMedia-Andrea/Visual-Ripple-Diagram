import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { StoryCard, PurposeTheme, Season, ActionPlan } from '@workspace/api-client-react';

function EditableText({
  value,
  onChange,
  onSave,
  multiline = false,
  placeholder = '',
  style,
  textStyle,
}: {
  value?: string;
  onChange: (val: string) => void;
  onSave: () => void;
  multiline?: boolean;
  placeholder?: string;
  style?: any;
  textStyle?: any;
}) {
  const colors = useColors();
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? '');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
      onSave();
    }
  };

  if (isEditing) {
    return (
      <TextInput
        ref={inputRef}
        testID="editable-text-input"
        value={localValue}
        onChangeText={setLocalValue}
        onBlur={handleBlur}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        autoFocus
        style={[styles.editableInput, { color: colors.foreground, borderColor: colors.primary }, style, textStyle]}
      />
    );
  }

  return (
    <Pressable
      testID="editable-text-trigger"
      onPress={() => setIsEditing(true)}
      style={[styles.editableTextContainer, style]}
      hitSlop={8}
    >
      <Text style={[styles.editableText, { color: value ? colors.foreground : colors.mutedForeground }, textStyle]}>
        {value || placeholder || 'Tap to edit...'}
      </Text>
    </Pressable>
  );
}

function EditableChipList({
  items,
  onChange,
  label,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  label: string;
}) {
  const colors = useColors();
  const [newItem, setNewItem] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
    }
    setNewItem('');
    setIsAdding(false);
  };

  const handleRemove = (idx: number) => {
    const next = [...items];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <View style={styles.chipListContainer}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={styles.chipRow}>
        {items.map((item, idx) => (
          <View key={idx} style={[styles.chip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.chipText, { color: colors.secondaryForeground }]}>{item}</Text>
            <Pressable onPress={() => handleRemove(idx)} hitSlop={8}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </Pressable>
          </View>
        ))}
        {isAdding ? (
          <TextInput
            ref={inputRef}
            value={newItem}
            onChangeText={setNewItem}
            onBlur={handleAdd}
            onSubmitEditing={handleAdd}
            style={[styles.chipInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.primary }]}
            autoFocus
          />
        ) : (
          <Pressable onPress={() => setIsAdding(true)} style={[styles.addChip, { borderColor: colors.border }]}>
            <Text style={[styles.addChipText, { color: colors.mutedForeground }]}>+ Add</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function EditableStringList({
  items,
  onChange,
  label,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  label: string;
}) {
  const colors = useColors();
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
    }
    setNewItem('');
  };

  const handleRemove = (idx: number) => {
    const next = [...items];
    next.splice(idx, 1);
    onChange(next);
  };

  const handleEdit = (idx: number, val: string) => {
    const next = [...items];
    next[idx] = val;
    onChange(next);
  };

  return (
    <View style={styles.stringListContainer}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={{ gap: 8, marginBottom: 8 }}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.stringListItem}>
            <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
            <View style={{ flex: 1 }}>
              <EditableText
                value={item}
                onChange={(val) => handleEdit(idx, val)}
                onSave={() => {}}
                textStyle={{ fontFamily: 'Poppins_400Regular', fontSize: 14 }}
              />
            </View>
            <Pressable onPress={() => handleRemove(idx)} hitSlop={8} style={{ padding: 4 }}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        ))}
      </View>
      <View style={styles.stringListAddRow}>
        <TextInput
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAdd}
          placeholder={`Add to ${label.toLowerCase()}...`}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.stringListInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
        />
        <Pressable onPress={handleAdd} style={[styles.stringListAddButton, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.stringListAddLabel, { color: colors.secondaryForeground }]}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function StoryCardView({
  card,
  onUpdate,
  onDelete,
}: {
  card: StoryCard;
  onUpdate: (card: { id: number; data: any }) => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const save = (changes: Partial<StoryCard>) => onUpdate({ id: card.id!, data: { ...card, ...changes } });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={onDelete} style={styles.deleteButton} hitSlop={12}>
        <Feather name="trash-2" size={16} color={colors.destructive} />
      </Pressable>
      <EditableText
        value={card.title}
        onChange={(title) => save({ title })}
        onSave={() => {}}
        placeholder="Story Title"
        textStyle={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 18, color: colors.primary, marginBottom: 8 }}
      />
      <EditableText
        value={card.summary}
        onChange={(summary) => save({ summary })}
        onSave={() => {}}
        multiline
        placeholder="Summary of the story..."
        textStyle={{ fontFamily: 'Poppins_400Regular', fontSize: 14, marginBottom: 16 }}
      />
      <View style={{ gap: 12 }}>
        <EditableChipList items={card.actions || []} onChange={(actions) => save({ actions })} label="Actions" />
        <EditableChipList items={card.feelings || []} onChange={(feelings) => save({ feelings })} label="Feelings" />
        <EditableChipList items={card.people || []} onChange={(people) => save({ people })} label="People" />
        <EditableChipList items={card.impact || []} onChange={(impact) => save({ impact })} label="Impact" />
      </View>
    </View>
  );
}

export function ThemeCardView({
  theme,
  onUpdate,
  onDelete,
}: {
  theme: PurposeTheme;
  onUpdate: (theme: { id: number; data: any }) => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const save = (changes: Partial<PurposeTheme>) => onUpdate({ id: theme.id!, data: { ...theme, ...changes } });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={onDelete} style={styles.deleteButton} hitSlop={12}>
        <Feather name="trash-2" size={16} color={colors.destructive} />
      </Pressable>
      <EditableText
        value={theme.name}
        onChange={(name) => save({ name })}
        onSave={() => {}}
        placeholder="Theme Name"
        textStyle={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 18, color: colors.accent, marginBottom: 8 }}
      />
      <EditableText
        value={theme.description}
        onChange={(description) => save({ description })}
        onSave={() => {}}
        multiline
        placeholder="Description..."
        textStyle={{ fontFamily: 'Poppins_400Regular', fontSize: 14, marginBottom: 16 }}
      />
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 8 }]}>WHERE THIS SHOWED UP</Text>
      <View style={{ gap: 8 }}>
        {(theme.evidence || []).map((ev, idx) => (
          <View key={idx} style={[styles.evidenceItem, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.evidenceLabel, { color: colors.mutedForeground }]}>Story:</Text>
            <EditableText
              value={ev.storyTitle}
              onChange={(storyTitle) => {
                const evs = [...(theme.evidence ?? [])];
                evs[idx] = { ...evs[idx], storyTitle };
                save({ evidence: evs });
              }}
              onSave={() => {}}
              placeholder="Story Title"
              textStyle={{ fontFamily: 'Poppins_500Medium', fontSize: 13 }}
            />
            <Text style={[styles.evidenceLabel, { color: colors.mutedForeground, marginTop: 4 }]}>Detail:</Text>
            <EditableText
              value={ev.detail}
              onChange={(detail) => {
                const evs = [...(theme.evidence ?? [])];
                evs[idx] = { ...evs[idx], detail };
                save({ evidence: evs });
              }}
              onSave={() => {}}
              placeholder="Detail"
              textStyle={{ fontFamily: 'Poppins_400Regular', fontSize: 13 }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export function SeasonFormView({
  season,
  onUpdate,
}: {
  season: Season;
  onUpdate: (season: Season) => void;
}) {
  const colors = useColors();
  const save = (changes: Partial<Season>) => onUpdate({ ...season, ...changes } as Season);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CURRENT SEASON</Text>
      <EditableText
        value={season.summary}
        onChange={(summary) => save({ summary })}
        onSave={() => {}}
        multiline
        placeholder="A summary of your current season..."
        textStyle={{ fontFamily: 'Poppins_400Regular', fontSize: 15, marginBottom: 16 }}
      />
      <View style={{ marginBottom: 16 }}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CAPACITY</Text>
        <EditableText
          value={season.capacity}
          onChange={(capacity) => save({ capacity })}
          onSave={() => {}}
          placeholder="How is your time and energy?"
          textStyle={{ fontFamily: 'Poppins_400Regular', fontSize: 14 }}
        />
      </View>
      <View style={{ gap: 12 }}>
        <EditableChipList items={season.roles || []} onChange={(roles) => save({ roles })} label="KEY ROLES" />
        <EditableChipList items={season.constraints || []} onChange={(constraints) => save({ constraints })} label="CONSTRAINTS" />
        <EditableChipList items={season.opportunities || []} onChange={(opportunities) => save({ opportunities })} label="OPPORTUNITIES" />
      </View>
      <View style={[styles.divider, { borderTopColor: colors.border }]} />
      <Text style={[styles.sectionLabel, { color: colors.accent, marginBottom: 8 }]}>WAYS TO LIVE YOUR PURPOSE NOW</Text>
      <EditableStringList
        items={season.expressions || []}
        onChange={(expressions) => save({ expressions })}
        label="EXPRESSIONS"
      />
    </View>
  );
}

export function ActionPlanFormView({
  actionPlan,
  onUpdate,
}: {
  actionPlan: ActionPlan;
  onUpdate: (actionPlan: ActionPlan) => void;
}) {
  const colors = useColors();
  const save = (changes: Partial<ActionPlan>) => onUpdate({ ...actionPlan, ...changes } as ActionPlan);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <EditableStringList items={actionPlan.start || []} onChange={(start) => save({ start })} label="START" />
      <EditableStringList items={actionPlan.stop || []} onChange={(stop) => save({ stop })} label="STOP" />
      <EditableStringList items={actionPlan.continue || []} onChange={(cont) => save({ continue: cont })} label="CONTINUE" />
      <View style={[styles.divider, { borderTopColor: colors.border }]} />
      <Text style={[styles.sectionLabel, { color: colors.primary, marginBottom: 8 }]}>ONE STEP THIS WEEK</Text>
      <EditableText
        value={actionPlan.oneStepThisWeek}
        onChange={(oneStepThisWeek) => save({ oneStepThisWeek })}
        onSave={() => {}}
        placeholder="What is the one concrete thing you will do?"
        textStyle={{ fontFamily: 'Poppins_500Medium', fontSize: 15 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  editableTextContainer: { paddingVertical: 2, paddingHorizontal: 4, marginHorizontal: -4, borderRadius: 6 },
  editableText: { fontFamily: 'Poppins_400Regular' },
  editableInput: { borderWidth: 1, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 6, marginHorizontal: -4 },
  sectionLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 },
  chipListContainer: { marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1 },
  chipText: { fontFamily: 'Poppins_400Regular', fontSize: 12 },
  chipInput: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1, fontFamily: 'Poppins_400Regular', fontSize: 12, minWidth: 60 },
  addChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  addChipText: { fontFamily: 'Poppins_400Regular', fontSize: 12 },
  stringListContainer: { marginBottom: 12 },
  stringListItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: { fontSize: 16, lineHeight: 22 },
  stringListAddRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stringListInput: { flex: 1, height: 36, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  stringListAddButton: { height: 36, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stringListAddLabel: { fontFamily: 'Poppins_500Medium', fontSize: 13 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  deleteButton: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  evidenceItem: { padding: 12, borderRadius: 12 },
  evidenceLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, opacity: 0.8 },
  divider: { borderTopWidth: 1, marginTop: 16, paddingTop: 16 },
});
