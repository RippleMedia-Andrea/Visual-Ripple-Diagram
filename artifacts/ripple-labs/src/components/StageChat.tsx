import { useState, useRef, useEffect } from "react";
import { useTranscribeRecording } from "@workspace/api-client-react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface StageChatProps {
  stage: string;
  messages: ChatMessage[];
  onMessages: (msgs: ChatMessage[]) => void;
  context?: Record<string, unknown>;
  stageColor: string;
  stageTextColor: string;
  cardBg: string;
  placeholder?: string;
  journeyId: number;
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;
  onRecordingBusy?: (busy: boolean) => void;
  /** Saved unsent text for this stage, restored on mount. */
  initialDraft?: string;
  /** Saved unsent transcript for this stage, restored on mount. */
  initialTranscript?: string;
  /** Persist per-key drafts. Keys are `${stage}` and `${stage}__transcript`. */
  onSaveDrafts?: (patch: Record<string, string>) => void;
  /** Text to place into the composer (user still sends explicitly). nonce forces re-apply. */
  seed?: { text: string; nonce: number } | null;
}

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");
const MAX_RECORD_SECONDS = 300;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Could not read the recording."));
    reader.readAsDataURL(blob);
  });
}

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function StageChat({
  stage,
  messages,
  onMessages,
  context,
  stageColor,
  stageTextColor,
  cardBg,
  placeholder = "Share your thoughts...",
  journeyId,
  isStreaming,
  setIsStreaming,
  onRecordingBusy,
  initialDraft = "",
  initialTranscript = "",
  onSaveDrafts,
  seed,
}: StageChatProps) {
  const [input, setInput] = useState(initialDraft);
  const [streamingText, setStreamingText] = useState("");
  const [chatError, setChatError] = useState("");
  const [retryMessages, setRetryMessages] = useState<ChatMessage[] | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // voice
  const [recState, setRecState] = useState<"idle" | "recording" | "transcribing">("idle");
  useEffect(() => {
    onRecordingBusy?.(recState !== "idle");
    return () => onRecordingBusy?.(false);
  }, [recState, onRecordingBusy]);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [micError, setMicError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const discardRef = useRef(false);
  const transcribe = useTranscribeRecording();
  const transcribeRef = useRef(transcribe.mutateAsync);
  transcribeRef.current = transcribe.mutateAsync;

  // draft persistence (ref timers so a cleared send is never overwritten by a stale save)
  const saveRef = useRef(onSaveDrafts);
  saveRef.current = onSaveDrafts;
  const draftTimer = useRef<number | null>(null);
  const transcriptTimer = useRef<number | null>(null);
  const pendingDrafts = useRef<Record<string, string>>({});

  function scheduleDraft(key: string, value: string, timer: React.MutableRefObject<number | null>) {
    pendingDrafts.current[key] = value;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      const v = pendingDrafts.current[key];
      delete pendingDrafts.current[key];
      if (v !== undefined) saveRef.current?.({ [key]: v });
    }, 700);
  }
  function saveNow(key: string, value: string, timer: React.MutableRefObject<number | null>) {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    delete pendingDrafts.current[key];
    saveRef.current?.({ [key]: value });
  }
  // flush unsaved typing if the tab is hidden or closed
  useEffect(() => {
    const flush = () => {
      const p = pendingDrafts.current;
      if (!Object.keys(p).length) return;
      pendingDrafts.current = {};
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
      if (transcriptTimer.current) window.clearTimeout(transcriptTimer.current);
      draftTimer.current = null;
      transcriptTimer.current = null;
      saveRef.current?.(p);
    };
    const onVis = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  useEffect(() => {
    if (seed && seed.text) {
      setInput((prev) => (prev.trim() ? `${prev.trim()}\n\n${seed.text}` : seed.text));
      textareaRef.current?.focus();
    }
  }, [seed?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, streamingText]);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (tickRef.current) window.clearInterval(tickRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try { recorderRef.current.stop(); } catch { /* ignore */ }
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      chunksRef.current = [];
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
      if (transcriptTimer.current) window.clearTimeout(transcriptTimer.current);
      // flush anything typed in the last moments so leaving a stage never loses it
      const p = pendingDrafts.current;
      pendingDrafts.current = {};
      if (Object.keys(p).length) saveRef.current?.(p);
    };
  }, []);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  async function streamReply(updatedMsgs: ChatMessage[], saveUserMessage: boolean) {
    setIsStreaming(true);
    setStreamingText("");
    setChatError("");
    setRetryMessages(null);
    let assistantText = "";
    let finished = false;
    try {
      const res = await fetch(`${BASE_URL}/api/ripple/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyId, stage, messages: updatedMsgs, context, saveUserMessage }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Your guide is unavailable right now.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const handleLine = (line: string) => {
        if (!line.startsWith("data: ")) return;
        let data: { content?: string; done?: boolean; error?: string };
        try { data = JSON.parse(line.slice(6)); } catch { return; }
        if (data.error) throw new Error(typeof data.error === "string" ? data.error : "Your guide is unavailable right now.");
        if (data.content) {
          assistantText += data.content;
          setStreamingText(assistantText);
        }
        if (data.done) finished = true;
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) handleLine(line.trim());
      }
      buffer += decoder.decode();
      if (buffer.trim()) handleLine(buffer.trim());
      if (!assistantText || !finished) throw new Error("The connection ended before your guide finished. Your words are kept as a draft. Please try again.");
      onMessages([...updatedMsgs, { role: "assistant", content: assistantText }]);
      if (!saveUserMessage) {
        setInput("");
        saveNow(stage, "", draftTimer);
      }
      void finished;
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Your guide is unavailable right now.");
      setRetryMessages(updatedMsgs);
      const lastUser = [...updatedMsgs].reverse().find(message => message.role === "user");
      if (lastUser) {
        setInput(lastUser.content);
        saveNow(stage, lastUser.content, draftTimer);
      }
    } finally {
      setStreamingText("");
      setIsStreaming(false);
    }
  }

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    if (text.length > 4000) {
      setChatError(`This message is ${text.length.toLocaleString()} characters. Each message can be up to 4,000. Your full text is kept as a draft; send it in parts.`);
      return;
    }
    const updatedMsgs = [...messages, { role: "user" as const, content: text }];
    onMessages(updatedMsgs);
    setInput("");
    saveNow(stage, "", draftTimer);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await streamReply(updatedMsgs, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  function cleanupStream() {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    setMicError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMicError("Recording isn't supported in this browser. You can always type instead.");
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = mediaStream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        cleanupStream();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        recorderRef.current = null;
        if (cancelledRef.current || discardRef.current) { discardRef.current = false; setRecState("idle"); return; }
        void processRecording(blob);
      };
      recorderRef.current = recorder;
      recorder.start(1000);
      setSeconds(0);
      setRecState("recording");
      tickRef.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_RECORD_SECONDS) stopRecording();
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      cleanupStream();
      const name = err instanceof DOMException ? err.name : "";
      setMicError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access was denied. You can allow it in your browser settings, or keep typing. Typing always works."
          : "The microphone couldn't start. You can keep typing.",
      );
      setRecState("idle");
    }
  }

  function stopRecording() {
    const r = recorderRef.current;
    if (r && r.state !== "inactive") r.stop();
  }

  function cancelRecording() {
    discardRef.current = true;
    stopRecording();
  }

  async function processRecording(blob: Blob) {
    if (blob.size === 0) { setRecState("idle"); setMicError("Nothing was recorded. Try again or type instead."); return; }
    if (blob.size > MAX_AUDIO_BYTES) { setRecState("idle"); setMicError("That recording is too long to convert. Try a shorter one, or type."); return; }
    setRecState("transcribing");
    try {
      const audio = await blobToBase64(blob);
      const result = await transcribeRef.current({ data: { audio } });
      const text = (result.text ?? "").trim();
      if (!text) {
        setMicError("We couldn't hear any words in that recording. Try again or type instead.");
      } else {
        setTranscript((prev) => {
          const next = prev ? `${prev} ${text}` : text;
          saveNow(`${stage}__transcript`, next, transcriptTimer);
          return next;
        });
      }
    } catch {
      setMicError("We couldn't convert that recording. Your words weren't sent anywhere else. Try again or type.");
    } finally {
      setRecState("idle");
    }
  }

  function useTranscript() {
    const t = transcript.trim();
    if (!t) return;
    setInput((prev) => {
      const next = prev.trim() ? `${prev.trim()} ${t}` : t;
      saveNow(stage, next, draftTimer);
      return next;
    });
    setTranscript("");
    saveNow(`${stage}__transcript`, "", transcriptTimer);
    window.setTimeout(() => { autoResize(); textareaRef.current?.focus(); }, 0);
  }

  function discardTranscript() {
    setTranscript("");
    saveNow(`${stage}__transcript`, "", transcriptTimer);
  }

  const gold = "#C8A96A";

  return (
    <div className="flex flex-col" style={{ minHeight: 0 }} data-testid="stage-chat">
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 rounded-2xl mb-4"
        style={{ backgroundColor: cardBg, maxHeight: "440px", minHeight: "220px" }}
        data-testid="messages-container"
      >
        {messages.length === 0 && !streamingText && (
          <div className="h-full flex items-center justify-center py-8">
            <p className="text-sm font-sans text-center opacity-40" style={{ color: stageTextColor }}>
              Your guide is ready when you are.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`message-${i}`}>
            {msg.role === "assistant" && (
              <div className="w-5 h-5 rounded-full flex-shrink-0 mr-2 mt-1 flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: gold, color: "#0F2A36" }}>R</div>
            )}
            <div
              className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm font-sans leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}
              style={
                msg.role === "user"
                  ? { backgroundColor: stageColor, color: stageTextColor, opacity: 0.9, boxShadow: "inset 0 0 0 1px rgba(200,169,106,0.2)" }
                  : { backgroundColor: "rgba(200,169,106,0.1)", color: stageTextColor, border: "1px solid rgba(200,169,106,0.18)" }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {streamingText && (
          <div className="flex justify-start" data-testid="streaming-message">
            <div className="w-5 h-5 rounded-full flex-shrink-0 mr-2 mt-1 flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: gold, color: "#0F2A36" }}>R</div>
            <div className="max-w-[82%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm font-sans leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: "rgba(200,169,106,0.1)", color: stageTextColor, border: "1px solid rgba(200,169,106,0.18)" }}>
              {streamingText}
              <span className="inline-block w-1 h-3 ml-0.5 animate-pulse" style={{ backgroundColor: gold }} />
            </div>
          </div>
        )}

        {isStreaming && !streamingText && (
          <div className="flex items-center gap-1.5 pl-7" data-testid="guide-listening">
            {[0, 1, 2].map((d) => (
              <span key={d} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: gold, animationDelay: `${d * 180}ms` }} />
            ))}
          </div>
        )}

        {chatError && (
          <div role="alert" className="rounded-xl px-4 py-3 text-xs font-sans flex flex-wrap items-center gap-3" style={{ backgroundColor: "rgba(180,70,60,0.14)", color: stageTextColor, border: "1px solid rgba(180,70,60,0.35)" }} data-testid="chat-error">
            <span className="flex-1">{chatError}</span>
            {retryMessages && (
              <button onClick={() => streamReply(retryMessages, false)} className="px-3 py-1 rounded-full border text-[11px]" style={{ borderColor: gold, color: stageTextColor }} data-testid="button-retry-chat">
                Ask again
              </button>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Transcript preview */}
      {(transcript || recState === "transcribing") && (
        <div className="mb-3 rounded-2xl p-3.5" style={{ backgroundColor: "rgba(200,169,106,0.1)", border: "1px dashed rgba(200,169,106,0.45)" }} data-testid="transcript-preview">
          <p className="text-[10px] font-sans uppercase tracking-widest mb-2" style={{ color: stageTextColor, opacity: 0.55 }}>
            {recState === "transcribing" ? "Turning your words into text..." : "Your words, ready to edit. Nothing is sent until you choose."}
          </p>
          {recState === "transcribing" && !transcript ? (
            <div className="space-y-2 py-1">
              <div className="h-2.5 rounded-full w-11/12 animate-pulse" style={{ backgroundColor: "rgba(200,169,106,0.25)" }} />
              <div className="h-2.5 rounded-full w-2/3 animate-pulse" style={{ backgroundColor: "rgba(200,169,106,0.18)" }} />
            </div>
          ) : (
            <textarea
              value={transcript}
              onChange={(e) => { setTranscript(e.target.value); scheduleDraft(`${stage}__transcript`, e.target.value, transcriptTimer); }}
              rows={3}
              className="w-full bg-transparent text-sm font-sans leading-relaxed outline-none resize-y"
              style={{ color: stageTextColor }}
              data-testid="input-transcript"
            />
          )}
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={discardTranscript} disabled={!transcript} className="px-3 py-1.5 rounded-full text-xs font-sans border disabled:opacity-30" style={{ borderColor: "rgba(200,169,106,0.35)", color: stageTextColor }} data-testid="button-discard-transcript">
              Discard
            </button>
            <button onClick={useTranscript} disabled={!transcript.trim()} className="px-3 py-1.5 rounded-full text-xs font-sans font-medium disabled:opacity-30" style={{ backgroundColor: gold, color: "#0F2A36" }} data-testid="button-use-transcript">
              Move into my message
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: "rgba(200,169,106,0.08)", border: "1px solid rgba(200,169,106,0.2)" }}>
        {recState === "recording" ? (
          <div className="flex-1 flex items-center gap-3 min-h-[40px]" data-testid="status-recording">
            <span className="relative flex w-2.5 h-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ backgroundColor: "#d26a5c", opacity: 0.6 }} />
              <span className="relative inline-flex rounded-full w-2.5 h-2.5" style={{ backgroundColor: "#d26a5c" }} />
            </span>
            <span className="text-sm font-sans tabular-nums" style={{ color: stageTextColor }}>
              Listening {formatTime(seconds)} <span className="opacity-40">/ 5:00</span>
            </span>
            <button onClick={cancelRecording} className="ml-auto text-xs font-sans underline opacity-60" style={{ color: stageTextColor }} data-testid="button-cancel-recording">
              Cancel
            </button>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent text-sm font-sans leading-relaxed resize-none outline-none placeholder:opacity-40"
            style={{ color: stageTextColor, minHeight: "40px", maxHeight: "160px" }}
            placeholder={isStreaming ? "Your guide is responding..." : placeholder}
            value={input}
            disabled={isStreaming}
            onChange={(e) => {
              setInput(e.target.value);
              scheduleDraft(stage, e.target.value, draftTimer);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={20000}
            data-testid="chat-input"
          />
        )}
        <button
          onClick={recState === "recording" ? stopRecording : startRecording}
          disabled={recState === "transcribing"}
          aria-label={recState === "recording" ? "Stop recording" : "Record your reflection"}
          title={recState === "recording" ? "Stop and convert to text" : "Speak instead of typing"}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={recState === "recording" ? { backgroundColor: "#d26a5c", color: "#fff8f0" } : { border: `1px solid ${gold}`, color: stageTextColor }}
          data-testid="button-microphone"
        >
          {recState === "recording" ? (
            <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: "currentColor" }} />
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4" />
            </svg>
          )}
        </button>
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isStreaming || recState === "recording"}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{ backgroundColor: gold, color: "#0F2A36" }}
          aria-label="Send"
          data-testid="send-button"
        >
          {isStreaming ? (
            <span className="w-3 h-3 border-2 border-[#0F2A36] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
      {micError && (
        <p role="alert" className="text-[11px] font-sans mt-1.5 px-1" style={{ color: stageTextColor, opacity: 0.8 }} data-testid="text-mic-error">
          {micError}
        </p>
      )}
      <p className="text-[10px] font-sans opacity-30 mt-1.5 text-right pr-1" style={{ color: stageTextColor }}>
        Enter to send · Shift+Enter for new line · Mic converts speech to text you can edit
      </p>
    </div>
  );
}
