import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { StoryCard, PurposeTheme, Season, ActionPlan } from "../lib/types";

// --- Base UI Components ---

function EditableText({
  value,
  onChange,
  onSave,
  multiline = false,
  className = "",
  placeholder = "",
}: {
  value: string;
  onChange: (val: string) => void;
  onSave: () => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
      onSave();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  if (isEditing) {
    const commonProps = {
      ref: inputRef as any,
      value: localValue,
      onChange: (e: any) => setLocalValue(e.target.value),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      className: `bg-white/10 outline-none border border-[#C8A96A]/50 rounded-md px-2 py-1 w-full focus:border-[#C8A96A] ${className}`,
      placeholder,
      autoFocus: true,
    };
    return multiline ? (
      <textarea {...commonProps} rows={3} style={{ resize: "none" }} />
    ) : (
      <input {...commonProps} />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-white/5 rounded-md px-1 -mx-1 border border-transparent transition-colors break-words ${className} ${!value && 'opacity-50 italic'}`}
      title="Click to edit"
    >
      {value || placeholder || "Click to edit..."}
    </div>
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
  const [newItem, setNewItem] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
    }
    setNewItem("");
    setIsAdding(false);
  };

  const handleRemove = (idx: number) => {
    const next = [...items];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="mb-3 last:mb-0">
      <p className="text-[10px] font-sans uppercase tracking-widest mb-2 opacity-70">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-black/20 border border-white/10 group"
          >
            <span className="break-words">{item}</span>
            <button
              onClick={() => handleRemove(idx)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
        {isAdding ? (
          <input
            ref={inputRef}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onBlur={handleAdd}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="px-3 py-1 rounded-full text-xs bg-white/10 border border-[#C8A96A] outline-none min-w-[5rem] w-auto max-w-full"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1 rounded-full text-xs border border-white/20 border-dashed hover:border-white/50 transition-colors opacity-80"
          >
            + Add
          </button>
        )}
      </div>
    </div>
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
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
    }
    setNewItem("");
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
    <div className="mb-4">
      <p className="text-[10px] font-sans uppercase tracking-widest mb-2 opacity-70">{label}</p>
      <ul className="space-y-2 mb-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 group">
            <span className="text-[#C8A96A] mt-0.5 min-w-[12px]">•</span>
            <div className="flex-1 min-w-0">
              <EditableText
                value={item}
                onChange={(val) => handleEdit(idx, val)}
                onSave={() => {}}
                className="text-sm font-sans"
              />
            </div>
            <button
              onClick={() => handleRemove(idx)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 px-2 py-0.5 flex-shrink-0"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={`Add to ${label.toLowerCase()}...`}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#C8A96A]"
        />
        <button onClick={handleAdd} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-sm transition-colors whitespace-nowrap flex-shrink-0">
          Add
        </button>
      </div>
    </div>
  );
}

// --- Specific Domain Components ---

export function StoryCardView({
  card,
  onUpdate,
  onDelete,
}: {
  card: StoryCard;
  onUpdate: (card: StoryCard) => void;
  onDelete: () => void;
}) {
  const save = (changes: Partial<StoryCard>) => onUpdate({ ...card, ...changes });

  return (
    <div className="bg-[#0F2A36]/40 border border-[#C8A96A]/20 rounded-2xl p-5 mb-4 relative group">
      <button
        onClick={onDelete}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition-opacity"
      >
        Delete
      </button>

      <EditableText
        value={card.title}
        onChange={(title) => save({ title })}
        onSave={() => {}}
        className="font-serif text-lg text-[#C8A96A] mb-2"
        placeholder="Story Title"
      />
      <EditableText
        value={card.summary}
        onChange={(summary) => save({ summary })}
        onSave={() => {}}
        multiline
        className="text-sm font-sans mb-4 opacity-90"
        placeholder="Summary of the story..."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditableChipList items={card.actions || []} onChange={(actions) => save({ actions })} label="Actions" />
        <EditableChipList items={card.feelings || []} onChange={(feelings) => save({ feelings })} label="Feelings" />
        <EditableChipList items={card.people || []} onChange={(people) => save({ people })} label="People" />
        <EditableChipList items={card.impact || []} onChange={(impact) => save({ impact })} label="Impact" />
      </div>
    </div>
  );
}

export function ThemeCardView({
  theme,
  onUpdate,
  onDelete,
}: {
  theme: PurposeTheme;
  onUpdate: (theme: PurposeTheme) => void;
  onDelete: () => void;
}) {
  const save = (changes: Partial<PurposeTheme>) => onUpdate({ ...theme, ...changes });

  return (
    <div className="bg-[#0F2A36]/40 border border-[#2F7F7B]/30 rounded-2xl p-5 mb-4 relative group">
      <button
        onClick={onDelete}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition-opacity"
      >
        Delete
      </button>

      <EditableText
        value={theme.name}
        onChange={(name) => save({ name })}
        onSave={() => {}}
        className="font-serif text-lg text-[#5FA8A5] mb-2"
        placeholder="Theme Name"
      />
      <EditableText
        value={theme.description}
        onChange={(description) => save({ description })}
        onSave={() => {}}
        multiline
        className="text-sm font-sans mb-4 opacity-90"
        placeholder="Description..."
      />

      <p className="text-[10px] font-sans uppercase tracking-widest mb-2 opacity-70">Where this showed up</p>
      <ul className="space-y-3">
        {(theme.evidence || []).map((ev, idx) => (
          <li key={idx} className="bg-black/10 rounded-lg p-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="opacity-80 text-xs">Story:</span>
              <EditableText
                value={ev.storyTitle}
                onChange={(storyTitle) => {
                  const evs = [...theme.evidence];
                  evs[idx] = { ...evs[idx], storyTitle };
                  save({ evidence: evs });
                }}
                onSave={() => {}}
                className="font-medium text-[#D7ECEB]"
                placeholder="Story Title"
              />
              <span className="opacity-80 text-xs mt-1">Detail:</span>
              <EditableText
                value={ev.detail}
                onChange={(detail) => {
                  const evs = [...theme.evidence];
                  evs[idx] = { ...evs[idx], detail };
                  save({ evidence: evs });
                }}
                onSave={() => {}}
                className="opacity-90"
                placeholder="Detail"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SeasonFormView({
  season,
  onUpdate,
}: {
  season: Season;
  onUpdate: (season: Season) => void;
}) {
  const save = (changes: Partial<Season>) => onUpdate({ ...season, ...changes });

  return (
    <div className="bg-[#0F2A36]/40 border border-[#C8A96A]/20 rounded-2xl p-5 mb-4">
      <p className="text-[10px] font-sans uppercase tracking-widest mb-1 opacity-70">Current Season</p>
      <EditableText
        value={season.summary}
        onChange={(summary) => save({ summary })}
        onSave={() => {}}
        multiline
        className="text-base font-sans mb-5"
        placeholder="A summary of your current season..."
      />

      <div className="mb-4">
        <p className="text-[10px] font-sans uppercase tracking-widest mb-1 opacity-70">Capacity</p>
        <EditableText
          value={season.capacity}
          onChange={(capacity) => save({ capacity })}
          onSave={() => {}}
          className="text-sm font-sans"
          placeholder="How is your time and energy?"
        />
      </div>

      <EditableChipList items={season.roles || []} onChange={(roles) => save({ roles })} label="Key Roles" />
      <EditableChipList items={season.constraints || []} onChange={(constraints) => save({ constraints })} label="Constraints" />
      <EditableChipList items={season.opportunities || []} onChange={(opportunities) => save({ opportunities })} label="Opportunities" />

      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-[10px] font-sans uppercase tracking-widest mb-3 text-[#5FA8A5]">Ways to live your purpose now</p>
        <EditableStringList
          items={season.expressions || []}
          onChange={(expressions) => save({ expressions })}
          label="Expressions"
        />
      </div>
    </div>
  );
}

export function ActionPlanFormView({
  actionPlan,
  onUpdate,
}: {
  actionPlan: ActionPlan;
  onUpdate: (actionPlan: ActionPlan) => void;
}) {
  const save = (changes: Partial<ActionPlan>) => onUpdate({ ...actionPlan, ...changes });

  return (
    <div className="bg-[#0F2A36]/40 border border-[#C8A96A]/20 rounded-2xl p-5 mb-4">
      <EditableStringList
        items={actionPlan.start || []}
        onChange={(start) => save({ start })}
        label="Start"
      />
      <EditableStringList
        items={actionPlan.stop || []}
        onChange={(stop) => save({ stop })}
        label="Stop"
      />
      <EditableStringList
        items={actionPlan.continue || []}
        onChange={(cont) => save({ continue: cont })}
        label="Continue"
      />

      <div className="mt-6 pt-5 border-t border-[#C8A96A]/20">
        <p className="text-[10px] font-sans uppercase tracking-widest mb-2 text-[#C8A96A]">One Step This Week</p>
        <EditableText
          value={actionPlan.oneStepThisWeek}
          onChange={(oneStepThisWeek) => save({ oneStepThisWeek })}
          onSave={() => {}}
          className="text-base font-medium"
          placeholder="What is the one concrete thing you will do?"
        />
      </div>
    </div>
  );
}
