import { useEffect, useState } from "react";
import type { PatternDiscovery, StoryCard } from "@/lib/types";
import rippleLabsLogo from "@assets/2876A1D3-1596-40F7-9384-F5AAA5F311E8_1777042604510.png";

const GOLD = "#C9A84C";

const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
const words = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 10);

/* ---------------- Reveal: story summary confirmation ---------------- */

export function StoryConfirmCard({
  card,
  index,
  textColor,
  onSave,
  onDelete,
}: {
  card: StoryCard;
  index: number;
  textColor: string;
  onSave: (card: StoryCard) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title ?? "");
  const [felt, setFelt] = useState((card.feelings ?? []).join("\n"));
  const [did, setDid] = useState((card.actions ?? []).join("\n"));
  const [changed, setChanged] = useState((card.impact ?? []).join("\n"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) return;
    setTitle(card.title ?? "");
    setFelt((card.feelings ?? []).join("\n"));
    setDid((card.actions ?? []).join("\n"));
    setChanged((card.impact ?? []).join("\n"));
  }, [card, editing]);

  async function persist(confirmed: boolean) {
    setSaving(true);
    setError("");
    try {
      const summary = `What you felt\n${felt.trim()}\n\nWhat you did\n${did.trim()}\n\nWhat changed\n${changed.trim()}`;
      await onSave({ ...card, title: title.trim() || card.title, summary, feelings: lines(felt), actions: lines(did), impact: lines(changed), confirmed });
      setEditing(false);
    } catch {
      setError("That didn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const confirmed = Boolean(card.confirmed);
  const sections: [string, string, (v: string) => void, string[]][] = [
    ["What you felt", felt, setFelt, card.feelings ?? []],
    ["What you did", did, setDid, card.actions ?? []],
    ["What changed", changed, setChanged, card.impact ?? []],
  ];

  return (
    <article
      className="rounded-2xl p-5 md:p-6 transition-colors"
      style={{
        backgroundColor: confirmed ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${confirmed ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.1)"}`,
        color: textColor,
      }}
      data-testid={`card-story-${card.id}`}
    >
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-sans uppercase tracking-widest opacity-50 mb-1">Story {index + 1}</p>
          {editing ? (
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent border-b font-serif text-xl outline-none pb-1" style={{ borderColor: "rgba(201,168,76,0.4)" }} data-testid={`input-story-title-${card.id}`} />
          ) : (
            <h3 className="font-serif text-xl leading-snug">{card.title}</h3>
          )}
        </div>
        <span className="flex-shrink-0 text-[10px] font-sans uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ backgroundColor: confirmed ? GOLD : "transparent", color: confirmed ? "#0B1F4B" : textColor, border: confirmed ? "none" : "1px solid rgba(255,255,255,0.2)", opacity: confirmed ? 1 : 0.6 }} data-testid={`status-story-${card.id}`}>
          {confirmed ? "Confirmed" : "Not yet confirmed"}
        </span>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map(([label, value, set, list]) => (
          <div key={label}>
            <p className="text-[10px] font-sans uppercase tracking-widest mb-2" style={{ color: GOLD }}>{label}</p>
            {editing ? (
              <textarea value={value} onChange={(e) => set(e.target.value)} rows={4} placeholder="One per line" className="w-full rounded-lg bg-black/10 p-2 text-sm font-sans leading-relaxed outline-none" style={{ color: textColor }} />
            ) : list.length ? (
              <ul className="space-y-1.5">
                {list.map((item, i) => (
                  <li key={i} className="text-sm font-sans leading-relaxed opacity-85">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-sans italic opacity-40">Nothing noted yet</p>
            )}
          </div>
        ))}
      </div>

      {error && <p role="alert" className="text-xs mt-3">{error}</p>}

      <footer className="flex flex-wrap gap-2 mt-5 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-full text-xs font-sans border" style={{ borderColor: "rgba(255,255,255,0.2)" }} data-testid={`button-cancel-story-${card.id}`}>Cancel</button>
            <button onClick={() => persist(false)} disabled={saving} className="px-4 py-2 rounded-full text-xs font-sans border disabled:opacity-40" style={{ borderColor: GOLD }} data-testid={`button-save-story-${card.id}`}>Save edits</button>
            <button onClick={() => persist(true)} disabled={saving} className="px-4 py-2 rounded-full text-xs font-sans font-medium disabled:opacity-40" style={{ backgroundColor: GOLD, color: "#0B1F4B" }} data-testid={`button-save-confirm-story-${card.id}`}>Save and confirm</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-full text-xs font-sans border" style={{ borderColor: "rgba(255,255,255,0.2)" }} data-testid={`button-edit-story-${card.id}`}>Edit</button>
            <button onClick={onDelete} className="px-4 py-2 rounded-full text-xs font-sans opacity-60 hover:opacity-100" data-testid={`button-delete-story-${card.id}`}>Remove</button>
            <span className="flex-1" />
            {confirmed ? (
              <button onClick={() => persist(false)} disabled={saving} className="px-4 py-2 rounded-full text-xs font-sans underline opacity-70 disabled:opacity-40" data-testid={`button-unconfirm-story-${card.id}`}>Undo confirm</button>
            ) : (
              <button onClick={() => persist(true)} disabled={saving} className="px-4 py-2 rounded-full text-xs font-sans font-medium disabled:opacity-40" style={{ backgroundColor: GOLD, color: "#0B1F4B" }} data-testid={`button-confirm-story-${card.id}`}>
                {saving ? "Saving..." : "Yes, that sounds right"}
              </button>
            )}
          </>
        )}
      </footer>
    </article>
  );
}

/* ---------------- Identify: saved reveal summaries ---------------- */

export function RevealSummaries({ cards, textColor }: { cards: StoryCard[]; textColor: string }) {
  const [open, setOpen] = useState(true);
  const shown = cards.filter((c) => c.confirmed).length ? cards.filter((c) => c.confirmed) : cards;
  if (!shown.length) return null;
  return (
    <section className="rounded-2xl p-5" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", color: textColor }} data-testid="reveal-summaries">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between" data-testid="button-toggle-summaries">
        <span className="text-[10px] font-sans uppercase tracking-widest opacity-60">Your Reveal summaries · {shown.length}</span>
        <span className="text-xs font-sans opacity-50">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          {shown.map((c) => (
            <div key={c.id} className="border-l-2 pl-4" style={{ borderColor: GOLD }}>
              <p className="font-serif text-base mb-1.5">{c.title}</p>
              <dl className="text-xs font-sans leading-relaxed space-y-1 opacity-80">
                <div><dt className="inline opacity-60">Felt: </dt><dd className="inline">{(c.feelings ?? []).join(", ") || "Not noted"}</dd></div>
                <div><dt className="inline opacity-60">Did: </dt><dd className="inline">{(c.actions ?? []).join(", ") || "Not noted"}</dd></div>
                <div><dt className="inline opacity-60">Changed: </dt><dd className="inline">{(c.impact ?? []).join(", ") || "Not noted"}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- Identify: pattern discovery form ---------------- */

export function PatternDiscoveryForm({
  value,
  textColor,
  onSave,
}: {
  value: PatternDiscovery | null;
  textColor: string;
  onSave: (next: PatternDiscovery) => Promise<void>;
}) {
  const [actionWords, setActionWords] = useState((value?.actionWords ?? []).join(", "));
  const [adjectives, setAdjectives] = useState((value?.adjectives ?? []).join(", "));
  const [impact, setImpact] = useState(value?.impact ?? "");
  const [equalCheck, setEqualCheck] = useState(Boolean(value?.confirmed));
  const [roleCheck, setRoleCheck] = useState(Boolean(value?.confirmed));
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const confirmed = Boolean(value?.confirmed);

  useEffect(() => {
    setActionWords((value?.actionWords ?? []).join(", "));
    setAdjectives((value?.adjectives ?? []).join(", "));
    setImpact(value?.impact ?? "");
    setEqualCheck(Boolean(value?.confirmed));
    setRoleCheck(Boolean(value?.confirmed));
  }, [value?.confirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  const build = (c: boolean): PatternDiscovery => ({ actionWords: words(actionWords), adjectives: words(adjectives), impact: impact.trim().slice(0, 2000), confirmed: c });
  const canConfirm = words(actionWords).length > 0 && impact.trim().length > 0 && equalCheck && roleCheck;

  async function save(c: boolean) {
    setSaving(true);
    setNote("");
    try {
      await onSave(build(c));
      setNote(c ? "Confirmed and saved." : "Saved. You can confirm when it feels true.");
    } catch {
      setNote("That didn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full rounded-xl bg-black/10 px-3.5 py-2.5 text-sm font-sans outline-none border focus:border-[#C9A84C]";
  return (
    <section className="rounded-2xl p-5 md:p-6 space-y-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: `1px solid ${confirmed ? GOLD : "rgba(201,168,76,0.2)"}`, color: textColor }} data-testid="form-pattern-discovery">
      <div>
        <p className="text-[10px] font-sans uppercase tracking-widest opacity-50 mb-1">In your own words</p>
        <h3 className="font-serif text-2xl">What you do, and what it changes</h3>
        <p className="text-xs font-sans opacity-60 mt-1">Your action and your impact carry equal weight. Many people share the same verb; it does not need to be unique.</p>
      </div>
      <label className="block">
        <span className="text-xs font-sans opacity-70">Action word(s), comma separated</span>
        <input value={actionWords} onChange={(e) => setActionWords(e.target.value)} placeholder="encourage, build, gather" className={field} style={{ color: textColor, borderColor: "rgba(255,255,255,0.1)" }} data-testid="input-action-words" />
      </label>
      <label className="block">
        <span className="text-xs font-sans opacity-70">Adjectives for how you do it (optional)</span>
        <input value={adjectives} onChange={(e) => setAdjectives(e.target.value)} placeholder="quietly, patiently" className={field} style={{ color: textColor, borderColor: "rgba(255,255,255,0.1)" }} data-testid="input-adjectives" />
      </label>
      <label className="block">
        <span className="text-xs font-sans opacity-70">Impact: what changes in other people</span>
        <textarea value={impact} onChange={(e) => setImpact(e.target.value)} rows={3} maxLength={2000} placeholder="People feel brave enough to try again." className={field} style={{ color: textColor, borderColor: "rgba(255,255,255,0.1)" }} data-testid="input-impact" />
      </label>
      <div className="space-y-2.5 rounded-xl p-4" style={{ backgroundColor: "rgba(201,168,76,0.08)" }}>
        <label className="flex gap-3 text-sm font-sans leading-relaxed cursor-pointer">
          <input type="checkbox" checked={equalCheck} onChange={(e) => setEqualCheck(e.target.checked)} className="mt-1 accent-[#C9A84C]" data-testid="checkbox-equal-weight" />
          <span>Both my action and its impact on others are named here.</span>
        </label>
        <label className="flex gap-3 text-sm font-sans leading-relaxed cursor-pointer">
          <input type="checkbox" checked={roleCheck} onChange={(e) => setRoleCheck(e.target.checked)} className="mt-1 accent-[#C9A84C]" data-testid="checkbox-any-season" />
          <span>Would this be true of me at home, at work, with friends, in any season? Yes, it isn't tied to one job or role.</span>
        </label>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={() => save(false)} disabled={saving} className="px-4 py-2 rounded-full text-xs font-sans border disabled:opacity-40" style={{ borderColor: GOLD }} data-testid="button-save-pattern">Save without confirming</button>
        <button onClick={() => save(true)} disabled={saving || !canConfirm} className="px-5 py-2 rounded-full text-xs font-sans font-medium disabled:opacity-40" style={{ backgroundColor: GOLD, color: "#0B1F4B" }} data-testid="button-confirm-pattern">
          {confirmed ? "Update and keep confirmed" : "This rings true. Confirm"}
        </button>
        {note && <span className="text-xs font-sans opacity-70" data-testid="text-pattern-status">{note}</span>}
      </div>
    </section>
  );
}

export function PatternSummary({ value, textColor }: { value: PatternDiscovery | null; textColor: string }) {
  if (!value || !value.confirmed) {
    return (
      <div className="rounded-2xl p-5 text-sm font-sans" style={{ border: "1px dashed rgba(201,168,76,0.35)", color: textColor, opacity: 0.75 }} data-testid="pattern-summary-empty">
        Your action and impact from Identify aren't confirmed yet. You can return to Identify, or name them here with your guide.
      </div>
    );
  }
  return (
    <section className="rounded-2xl p-5 grid sm:grid-cols-2 gap-5" style={{ backgroundColor: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.35)", color: textColor }} data-testid="pattern-summary">
      <div>
        <p className="text-[10px] font-sans uppercase tracking-widest mb-2" style={{ color: GOLD }}>Your action</p>
        <p className="font-serif text-2xl leading-tight">{value.actionWords.join(", ")}</p>
        {value.adjectives.length > 0 && <p className="text-xs font-sans opacity-60 mt-1">{value.adjectives.join(", ")}</p>}
      </div>
      <div>
        <p className="text-[10px] font-sans uppercase tracking-widest mb-2" style={{ color: GOLD }}>Your impact</p>
        <p className="font-script text-xl leading-snug">{value.impact}</p>
      </div>
    </section>
  );
}

/* ---------------- Pinpoint: purpose page ---------------- */

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PurposePage({ statement, pattern, onClose }: { statement: string; pattern: PatternDiscovery | null; onClose: () => void }) {
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function downloadHtml() {
    const action = pattern?.confirmed ? pattern.actionWords.join(", ") : "";
    const impact = pattern?.confirmed ? pattern.impact : "";
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Purpose</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F5F1E8;color:#0B1F4B;font-family:Georgia,'Times New Roman',serif}
main{max-width:640px;padding:64px 32px;text-align:center}.k{font:600 11px/1 system-ui,sans-serif;letter-spacing:.28em;text-transform:uppercase;color:#1E3A6E}
.rule{width:56px;height:1px;background:#C9A84C;margin:28px auto}h1{font-weight:400;font-style:italic;font-size:34px;line-height:1.35;margin:0}
.g{display:flex;gap:32px;justify-content:center;margin-top:36px;text-align:left}.g p{margin:6px 0 0;font-size:16px}.f{margin-top:56px;font:12px system-ui,sans-serif;color:#5A6B8C}</style></head>
<body><main><p class="k">My purpose</p><div class="rule"></div><h1>${escapeHtml(statement)}</h1><div class="rule"></div>
${action || impact ? `<div class="g">${action ? `<div><span class="k">Action</span><p>${escapeHtml(action)}</p></div>` : ""}${impact ? `<div><span class="k">Impact</span><p>${escapeHtml(impact)}</p></div>` : ""}</div>` : ""}
<p class="f">Named in the Ripple Labs Purpose Lab · ${escapeHtml(date)}</p></main></body></html>`;
    download("my-purpose.html", html, "text/html");
  }

  function downloadText() {
    const parts = ["MY PURPOSE", "", statement, ""];
    if (pattern?.confirmed) parts.push(`Action: ${pattern.actionWords.join(", ")}`, `Impact: ${pattern.impact}`, "");
    parts.push(`Ripple Labs Purpose Lab, ${date}`);
    download("my-purpose.txt", parts.join("\n"), "text/plain");
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#F5F1E8] text-[#0B1F4B] print:static" role="dialog" aria-modal="true" aria-label="Your purpose page" data-testid="purpose-page">
      <div className="absolute inset-0 pointer-events-none opacity-[0.35]" style={{ background: "radial-gradient(circle at 50% 38%, rgba(95,168,165,0.18), transparent 55%), radial-gradient(circle at 50% 38%, transparent 30%, rgba(201,168,76,0.12) 31%, transparent 32%, transparent 44%, rgba(201,168,76,0.08) 45%, transparent 46%)" }} />
      <div className="relative min-h-[100dvh] flex flex-col">
        <div className="flex flex-wrap items-center justify-end gap-2 p-4 print:hidden">
          <button onClick={downloadHtml} className="px-4 py-2 rounded-full text-xs font-sans bg-[#0B1F4B] text-[#F5F1E8]" data-testid="button-download-html">Download page</button>
          <button onClick={downloadText} className="px-4 py-2 rounded-full text-xs font-sans border border-[#0B1F4B]/25" data-testid="button-download-text">Download text</button>
          <button onClick={() => window.print()} className="px-4 py-2 rounded-full text-xs font-sans border border-[#0B1F4B]/25" data-testid="button-print">Print</button>
          <button onClick={onClose} className="px-4 py-2 rounded-full text-xs font-sans opacity-60 hover:opacity-100" data-testid="button-close-purpose-page">Close</button>
        </div>
        <main className="flex-1 flex items-center justify-center px-6 pb-16">
          <div className="max-w-2xl text-center">
            <img src={rippleLabsLogo} alt="Ripple Labs" className="h-8 w-auto mx-auto mb-10 rounded-md opacity-80" />
            <p className="text-[11px] font-sans uppercase tracking-[0.3em] text-[#1E3A6E]">My purpose</p>
            <div className="w-14 h-px mx-auto my-8" style={{ backgroundColor: GOLD }} />
            <p className="font-script text-4xl md:text-5xl leading-[1.3] break-words" data-testid="text-purpose-statement">{statement}</p>
            <div className="w-14 h-px mx-auto my-8" style={{ backgroundColor: GOLD }} />
            {pattern?.confirmed && (
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 justify-center text-left mt-2">
                <div>
                  <p className="text-[10px] font-sans uppercase tracking-widest text-[#1E3A6E]">Action</p>
                  <p className="font-serif text-lg mt-1">{pattern.actionWords.join(", ")}</p>
                </div>
                <div className="max-w-xs">
                  <p className="text-[10px] font-sans uppercase tracking-widest text-[#1E3A6E]">Impact</p>
                  <p className="font-serif text-lg mt-1">{pattern.impact}</p>
                </div>
              </div>
            )}
            <p className="text-xs font-sans text-[#0B1F4B]/50 mt-14">Named in the Ripple Labs Purpose Lab · {date}</p>
            <p className="text-[11px] font-sans text-[#0B1F4B]/40 mt-2 print:hidden">This page is laid out to screenshot cleanly.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------- Practice mode ---------------- */

export const PRACTICE_SAMPLES = [
  {
    title: "Sample story: the Saturday garden",
    text: "Last spring I organized our street to clear the empty lot on Saturdays. I made the sign-up sheet, brought coffee, and kept checking on the older neighbors. I felt awake and useful. By June, people who had never spoken were trading tomatoes and watching each other's kids.",
  },
  {
    title: "Sample story: the hard semester",
    text: "When my sister was failing chemistry I sat with her every night for six weeks. I broke the problems into small steps and kept telling her she could do it. I felt patient and steady. She passed, and later told me it was the first time she believed she was smart.",
  },
];

export function PracticePanel({ textColor, onUseSample }: { textColor: string; onUseSample: (text: string) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-2xl p-5 text-sm font-sans" style={{ backgroundColor: "rgba(201,168,76,0.14)", border: "1px dashed rgba(201,168,76,0.6)", color: textColor }} data-testid="practice-panel">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between" data-testid="button-toggle-practice-help">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: GOLD }}>Practice notebook · separate from your own journey</span>
        <span className="text-xs opacity-60">{open ? "Hide" : "How to test"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3 leading-relaxed">
          <p className="opacity-85">Nothing here touches your personal discoveries. Use the stage dots to jump to any stage. Try typing and the microphone in each one.</p>
          <ol className="list-decimal pl-5 space-y-1 opacity-80 text-xs">
            <li>Reveal: choose a prompt, paste a sample story, confirm two summaries.</li>
            <li>Identify: say what you notice first, then fill and confirm the action and impact form.</li>
            <li>Pinpoint: draft a statement, answer the repeated why, read it out loud, save, and open the purpose page.</li>
          </ol>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRACTICE_SAMPLES.map((s) => (
              <button key={s.title} onClick={() => onUseSample(s.text)} className="text-left rounded-xl p-3 bg-black/10 hover:bg-black/20 transition-colors" data-testid={`button-sample-${s.title.split(": ")[1].replace(/\s+/g, "-").toLowerCase()}`}>
                <span className="block text-xs font-medium mb-1">{s.title}</span>
                <span className="block text-[11px] opacity-60 line-clamp-2">{s.text}</span>
                <span className="block text-[10px] mt-1.5 uppercase tracking-widest" style={{ color: GOLD }}>Place in message box</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
