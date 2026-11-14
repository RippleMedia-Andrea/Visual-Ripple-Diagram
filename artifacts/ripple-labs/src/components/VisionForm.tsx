import { useEffect, useState } from "react";
import type { Vision } from "@/lib/types";

export function VisionForm({ vision, onSave }: { vision: Vision; onSave: (vision: Vision) => Promise<void> }) {
  const [draft, setDraft] = useState(vision);
  const [status, setStatus] = useState("");
  useEffect(() => setDraft(vision), [vision]);
  const labels = { picture: "The life I picture", influences: "Where that picture came from", beforeStarting: "What I thought I needed first" };
  return <section className="rounded-xl bg-[#F5F1E8] p-5 text-[#0F2A36] space-y-4">
    <h3 className="font-serif text-xl">Your Vision</h3>
    {(Object.keys(labels) as Array<keyof Vision>).map((key) => <label key={key} className="block text-sm">
      {labels[key]}
      <textarea aria-label={labels[key]} className="mt-1 w-full rounded-lg border p-3 bg-white" value={draft[key]} onChange={(e) => { setDraft({ ...draft, [key]: e.target.value }); setStatus(""); }} />
    </label>)}
    <button type="button" className="rounded-full bg-[#2F7F7B] px-5 py-2 text-white disabled:opacity-50" disabled={status === "Saving…"} onClick={async () => {
      setStatus("Saving…");
      try { await onSave(draft); setStatus("Saved"); } catch { setStatus("Unable to save. Please try again."); }
    }}>Save vision</button>
    <p role="status" className="text-sm">{status}</p>
  </section>;
}
