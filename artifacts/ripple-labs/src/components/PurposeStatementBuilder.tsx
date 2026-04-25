import { useState } from "react";

const SUGGESTED_STATEMENTS = [
  {
    id: "a",
    action: "helps people feel seen",
    impact: "know they matter",
    full: "I am someone who helps people feel seen, so others can know they matter.",
  },
  {
    id: "b",
    action: "brings clarity to confusing situations",
    impact: "move forward with confidence",
    full: "I am someone who brings clarity to confusing situations, so others can move forward with confidence.",
  },
  {
    id: "c",
    action: "encourages growth",
    impact: "become who they were created to be",
    full: "I am someone who encourages growth, so others can become who they were created to be.",
  },
];

const GUIDANCE_QUESTIONS = [
  "Does this sound like you?",
  "Does this reflect how you naturally show up?",
  "Does the impact focus on others?",
  "Is this simple enough to remember and repeat?",
];

type Mode = "choose" | "custom";

interface PurposeStatementBuilderProps {
  textColor: string;
  cardBg: string;
}

export function PurposeStatementBuilder({ textColor, cardBg }: PurposeStatementBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("choose");
  const [customStatement, setCustomStatement] = useState("");
  const [checkedGuides, setCheckedGuides] = useState<boolean[]>(
    new Array(GUIDANCE_QUESTIONS.length).fill(false)
  );
  const [confirmed, setConfirmed] = useState(false);

  const activeStatement =
    mode === "custom"
      ? customStatement
      : SUGGESTED_STATEMENTS.find((s) => s.id === selectedId)?.full ?? "";

  const toggleGuide = (i: number) => {
    setCheckedGuides((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMode("choose");
    setConfirmed(false);
  };

  const handleCustomMode = () => {
    setMode("custom");
    setSelectedId(null);
    setConfirmed(false);
  };

  return (
    <div className="space-y-6" data-testid="purpose-statement-builder">
      {/* Format callout */}
      <div
        className="rounded-2xl px-6 py-6 text-center"
        style={{ backgroundColor: "rgba(200,169,106,0.12)", border: "1px solid rgba(200,169,106,0.25)" }}
        data-testid="format-callout"
      >
        <p
          className="text-[10px] font-sans uppercase tracking-widest mb-2"
          style={{ color: textColor, opacity: 0.5 }}
        >
          Your Purpose Statement Format
        </p>
        <p
          className="text-lg md:text-xl font-serif font-semibold leading-snug"
          style={{ color: textColor, fontFamily: "'Playfair Display', serif" }}
          data-testid="format-template"
        >
          "I am someone who{" "}
          <span style={{ color: "#C8A96A" }}>[action]</span>, so others can{" "}
          <span style={{ color: "#C8A96A" }}>[impact]</span>."
        </p>
        <p
          className="text-xs font-sans mt-3 max-w-md mx-auto leading-relaxed"
          style={{ color: textColor, opacity: 0.6 }}
        >
          Your purpose statement begins with identity and ends with impact. It is not just what you do. It reflects who you are and how your life helps others.
        </p>
      </div>

      {/* Suggested Statements */}
      <div data-testid="suggested-statements">
        <p
          className="text-[10px] font-sans uppercase tracking-widest mb-3"
          style={{ color: textColor, opacity: 0.45 }}
        >
          Suggested Starting Points
        </p>
        <div className="space-y-2.5">
          {SUGGESTED_STATEMENTS.map((s) => {
            const isSelected = selectedId === s.id && mode === "choose";
            return (
              <button
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className="w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 hover:opacity-90 group"
                style={{
                  backgroundColor: isSelected
                    ? "rgba(200,169,106,0.18)"
                    : cardBg,
                  borderColor: isSelected
                    ? "rgba(200,169,106,0.6)"
                    : "rgba(200,169,106,0.1)",
                }}
                data-testid={`suggestion-${s.id}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: isSelected ? "#C8A96A" : "rgba(200,169,106,0.35)",
                      backgroundColor: isSelected ? "#C8A96A" : "transparent",
                    }}
                  >
                    {isSelected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <p
                    className="text-sm font-sans leading-relaxed"
                    style={{ color: textColor, opacity: isSelected ? 1 : 0.75 }}
                  >
                    {s.full}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ backgroundColor: "rgba(200,169,106,0.15)" }} />
        <span className="text-[10px] font-sans uppercase tracking-widest" style={{ color: textColor, opacity: 0.35 }}>
          or write your own
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: "rgba(200,169,106,0.15)" }} />
      </div>

      {/* Custom editor */}
      <div data-testid="custom-statement-area">
        <p
          className="text-[10px] font-sans uppercase tracking-widest mb-2"
          style={{ color: textColor, opacity: 0.45 }}
        >
          Your Purpose Statement
        </p>
        <div
          className="rounded-xl overflow-hidden border transition-all"
          style={{
            borderColor: mode === "custom" ? "rgba(200,169,106,0.5)" : "rgba(200,169,106,0.15)",
            backgroundColor: cardBg,
          }}
        >
          <div
            className="px-4 py-2.5 text-[10px] font-sans opacity-50 border-b"
            style={{ color: textColor, borderColor: "rgba(200,169,106,0.1)" }}
          >
            "I am someone who [action], so others can [impact]."
          </div>
          <textarea
            className="w-full px-4 py-3 text-sm font-sans leading-relaxed resize-none bg-transparent outline-none placeholder:opacity-30"
            rows={3}
            style={{ color: textColor }}
            placeholder="I am someone who _________, so others can _________."
            value={mode === "custom" ? customStatement : activeStatement}
            onFocus={handleCustomMode}
            onChange={(e) => {
              setCustomStatement(e.target.value);
              setConfirmed(false);
            }}
            data-testid="statement-textarea"
          />
        </div>
        {mode === "choose" && selectedId && (
          <p
            className="text-[10px] font-sans mt-1.5 ml-1 opacity-50"
            style={{ color: textColor }}
          >
            Click the text area above to edit the selected statement.
          </p>
        )}
      </div>

      {/* Guidance questions */}
      {(activeStatement.trim().length > 0) && (
        <div data-testid="guidance-questions">
          <p
            className="text-[10px] font-sans uppercase tracking-widest mb-3"
            style={{ color: textColor, opacity: 0.45 }}
          >
            Check Your Statement
          </p>
          <div className="space-y-2">
            {GUIDANCE_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => toggleGuide(i)}
                className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{ backgroundColor: cardBg }}
                data-testid={`guidance-q-${i}`}
              >
                <div
                  className="flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: checkedGuides[i] ? "#C8A96A" : "rgba(200,169,106,0.3)",
                    backgroundColor: checkedGuides[i] ? "#C8A96A" : "transparent",
                  }}
                >
                  {checkedGuides[i] && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className="text-sm font-sans" style={{ color: textColor, opacity: 0.75 }}>
                  {q}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm / save */}
      {activeStatement.trim().length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-3" data-testid="confirm-area">
          <button
            onClick={() => setConfirmed(true)}
            className="flex-1 py-3 px-6 rounded-full text-sm font-sans font-medium transition-all text-center hover:opacity-90"
            style={{ backgroundColor: "#2F7F7B", color: "#ffffff" }}
            data-testid="confirm-statement-btn"
          >
            {confirmed ? "✓ Statement Saved" : "Save My Purpose Statement"}
          </button>
          <button
            onClick={() => {
              setSelectedId(null);
              setMode("custom");
              setCustomStatement("");
              setCheckedGuides(new Array(GUIDANCE_QUESTIONS.length).fill(false));
              setConfirmed(false);
            }}
            className="text-xs font-sans underline underline-offset-2 opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: textColor }}
            data-testid="start-over-btn"
          >
            Start over
          </button>
        </div>
      )}

      {confirmed && (
        <div
          className="rounded-xl px-5 py-4 text-center"
          style={{ backgroundColor: "rgba(47,127,123,0.15)", border: "1px solid rgba(47,127,123,0.3)" }}
          data-testid="confirmed-statement"
        >
          <p
            className="text-[10px] font-sans uppercase tracking-widest mb-2"
            style={{ color: textColor, opacity: 0.5 }}
          >
            Your Purpose Statement
          </p>
          <p
            className="font-script text-lg leading-snug"
            style={{ color: textColor }}
          >
            {activeStatement}
          </p>
        </div>
      )}
    </div>
  );
}
