import { useState, useRef, useEffect } from "react";

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
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;
}

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

export function StageChat({
  stage,
  messages,
  onMessages,
  context,
  stageColor,
  stageTextColor,
  cardBg,
  placeholder = "Share your thoughts...",
  isStreaming,
  setIsStreaming,
}: StageChatProps) {
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const newUserMsg: ChatMessage = { role: "user", content: text };
    const updatedMsgs = [...messages, newUserMsg];
    onMessages(updatedMsgs);
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch(`${BASE_URL}/api/ripple/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          messages: updatedMsgs,
          context,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to connect to AI");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              assistantText += data.content;
              setStreamingText(assistantText);
            }
            if (data.done) {
              onMessages([
                ...updatedMsgs,
                { role: "assistant", content: assistantText },
              ]);
              setStreamingText("");
              setIsStreaming(false);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      onMessages([
        ...updatedMsgs,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
      setStreamingText("");
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: 0 }} data-testid="stage-chat">
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 rounded-2xl mb-4"
        style={{ backgroundColor: cardBg, maxHeight: "420px", minHeight: "220px" }}
        data-testid="messages-container"
      >
        {messages.length === 0 && !streamingText && (
          <div className="h-full flex items-center justify-center py-8">
            <p
              className="text-sm font-sans text-center opacity-40"
              style={{ color: stageTextColor }}
            >
              Your guide is ready when you are.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            data-testid={`message-${i}`}
          >
            {msg.role === "assistant" && (
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 mr-2 mt-1 flex items-center justify-center text-[8px] font-bold"
                style={{
                  backgroundColor: "#C8A96A",
                  color: "#0F2A36",
                }}
              >
                R
              </div>
            )}
            <div
              className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm font-sans leading-relaxed whitespace-pre-wrap ${
                msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
              }`}
              style={
                msg.role === "user"
                  ? {
                      backgroundColor: stageColor,
                      color: stageTextColor,
                      opacity: 0.9,
                    }
                  : {
                      backgroundColor: "rgba(200,169,106,0.1)",
                      color: stageTextColor,
                      border: "1px solid rgba(200,169,106,0.18)",
                    }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {streamingText && (
          <div className="flex justify-start" data-testid="streaming-message">
            <div
              className="w-5 h-5 rounded-full flex-shrink-0 mr-2 mt-1 flex items-center justify-center text-[8px] font-bold"
              style={{ backgroundColor: "#C8A96A", color: "#0F2A36" }}
            >
              R
            </div>
            <div
              className="max-w-[82%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm font-sans leading-relaxed whitespace-pre-wrap"
              style={{
                backgroundColor: "rgba(200,169,106,0.1)",
                color: stageTextColor,
                border: "1px solid rgba(200,169,106,0.18)",
              }}
            >
              {streamingText}
              <span className="inline-block w-1 h-3 ml-0.5 animate-pulse" style={{ backgroundColor: "#C8A96A" }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-end gap-3 px-3 py-2.5 rounded-2xl"
        style={{
          backgroundColor: "rgba(200,169,106,0.08)",
          border: "1px solid rgba(200,169,106,0.2)",
        }}
      >
        <textarea
          ref={textareaRef}
          className="flex-1 bg-transparent text-sm font-sans leading-relaxed resize-none outline-none placeholder:opacity-40"
          style={{ color: stageTextColor, minHeight: "40px", maxHeight: "160px" }}
          placeholder={isStreaming ? "Your guide is responding..." : placeholder}
          value={input}
          disabled={isStreaming}
          onChange={(e) => {
            setInput(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          data-testid="chat-input"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isStreaming}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{ backgroundColor: "#C8A96A", color: "#0F2A36" }}
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
      <p className="text-[10px] font-sans opacity-30 mt-1.5 text-right pr-1" style={{ color: stageTextColor }}>
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
