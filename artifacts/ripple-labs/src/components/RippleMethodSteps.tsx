import { useState } from "react";

const steps = [
  {
    number: "01",
    id: "reveal",
    title: "Reveal",
    subtitle: "Your Story",
    belief: "Your story holds clues.",
    teaching:
      "You are not becoming someone else. You are uncovering who you already are. Every meaningful experience — the highs, the lows, the moments that made you come alive — contains a thread of your purpose.",
    prompts: [
      "Early experiences that shaped you",
      "Moments you felt most alive",
      "Challenges that changed you",
      "Defining memories and turning points",
    ],
    color: "#0F2A36",
    textColor: "#ffffff",
    accentColor: "#D7ECEB",
  },
  {
    number: "02",
    id: "identify",
    title: "Identify",
    subtitle: "Your Patterns",
    belief: "Patterns reveal purpose.",
    teaching:
      "Across your stories, there are recurring themes — emotions you keep feeling, actions you keep taking, values that keep surfacing. These patterns are not coincidences. They are clues.",
    prompts: [
      "Recurring emotions and values",
      "Natural strengths and gifts",
      "Who you most want to impact",
      "What motivates you from within",
    ],
    color: "#1a4a55",
    textColor: "#ffffff",
    accentColor: "#D7ECEB",
  },
  {
    number: "03",
    id: "pinpoint",
    title: "Pinpoint",
    subtitle: "Your Purpose",
    belief: "Purpose is who you are in motion.",
    teaching:
      "Your patterns point to a purpose that is uniquely yours. Not a career title or a role — but a statement of who you are and the impact you were made to create.",
    prompts: [
      '"I wake up every day to [action]…"',
      '"…so that [impact on others]."',
      "Purpose always ends with others",
      "Simple, clear, yours",
    ],
    color: "#2F7F7B",
    textColor: "#ffffff",
    accentColor: "#F5F1E8",
  },
  {
    number: "04",
    id: "personalize",
    title: "Personalize",
    subtitle: "Your Season",
    belief: "Your purpose is not limited by your season. It is expressed through it.",
    teaching:
      "Purpose remains constant, but its expression changes by season. The roles you carry, the capacity you have, the responsibilities on your plate — these shape how your purpose shows up right now.",
    prompts: [
      "Your current roles and responsibilities",
      "Capacity in this season of life",
      "What purpose looks like today",
      "Small, faithful expressions",
    ],
    color: "#5FA8A5",
    textColor: "#0F2A36",
    accentColor: "#0F2A36",
  },
  {
    number: "05",
    id: "live",
    title: "Live",
    subtitle: "Your Ripple",
    belief: "Small actions create a life of purpose.",
    teaching:
      "Purpose lived out is not grand gestures. It is the accumulation of small, intentional choices aligned with who you are. Start with what you can begin, stop what is draining you, and build on what is already working.",
    prompts: [
      "Start — what do you need to begin?",
      "Stop — what is misaligned?",
      "Continue — what is already working?",
      "One aligned action this week",
    ],
    color: "#9fd0cd",
    textColor: "#0F2A36",
    accentColor: "#0F2A36",
  },
  {
    number: "06",
    id: "expand",
    title: "Expand",
    subtitle: "Your Growth",
    belief: "What's within you creates a ripple.",
    teaching:
      "As you live from purpose, your life becomes a ripple that touches others — your family, your community, your work. Growth is not a destination. It is the natural result of living from the inside out.",
    prompts: [
      "Morning intention practice",
      "Evening reflection",
      "Revisit in future seasons",
      "Invite others into the journey",
    ],
    color: "#EEE9DB",
    textColor: "#0F2A36",
    accentColor: "#0F2A36",
  },
];

interface Props {
  showFull?: boolean;
  className?: string;
}

export function RippleMethodSteps({ showFull = false, className = "" }: Props) {
  const [activeStep, setActiveStep] = useState<string | null>(null);

  return (
    <div className={`w-full ${className}`} data-testid="ripple-method-steps">
      {/* Flow connector row */}
      <div className="relative">
        {/* Horizontal connector line (desktop) */}
        <div
          className="hidden md:block absolute top-[52px] left-[8%] right-[8%] h-px z-0"
          style={{
            background:
              "linear-gradient(to right, #0F2A36, #2F7F7B, #5FA8A5, #9fd0cd, #D7ECEB)",
          }}
        />

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative z-10">
          {steps.map((step, idx) => {
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(isActive ? null : step.id)}
                data-testid={`step-button-${step.id}`}
                className="flex flex-col items-center text-center group"
              >
                {/* Circle node */}
                <div
                  className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-sm font-sans font-semibold mb-3 transition-all duration-300 border-2 ${
                    isActive
                      ? "scale-110 shadow-lg"
                      : "scale-100 shadow-sm group-hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: step.color,
                    color: step.textColor,
                    borderColor: isActive ? "#C8A96A" : step.color,
                  }}
                >
                  {step.number}
                </div>

                <p
                  className={`text-sm font-serif font-semibold transition-colors ${
                    isActive ? "text-[#2F7F7B]" : "text-[#0F2A36] group-hover:text-[#2F7F7B]"
                  }`}
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {step.title}
                </p>
                <p className="text-[10px] font-sans uppercase tracking-widest text-[#5FA8A5] mt-0.5">
                  {step.subtitle}
                </p>

                {/* Mobile: connector arrow between steps */}
                {idx < steps.length - 1 && (
                  <div className="md:hidden text-[#C8A96A] text-xs mt-2 opacity-50">↓</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded detail panel */}
      {activeStep && (() => {
        const step = steps.find((s) => s.id === activeStep)!;
        return (
          <div
            className="mt-8 rounded-2xl overflow-hidden shadow-md transition-all duration-300"
            data-testid="step-detail-panel"
          >
            <div
              className="px-8 py-8 md:py-10"
              style={{ backgroundColor: step.color }}
            >
              <div className="max-w-2xl mx-auto">
                <div className="flex items-start gap-5">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-sans font-semibold flex-shrink-0 mt-1 border"
                    style={{
                      borderColor: "#C8A96A",
                      color: step.textColor,
                      backgroundColor: "rgba(255,255,255,0.12)",
                    }}
                  >
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-xs font-sans uppercase tracking-widest mb-1"
                      style={{ color: step.accentColor, opacity: 0.7 }}
                    >
                      {step.subtitle}
                    </p>
                    <h3
                      className="text-2xl font-serif font-semibold mb-1"
                      style={{
                        color: step.textColor,
                        fontFamily: "'Playfair Display', serif",
                      }}
                    >
                      {step.title}
                    </h3>
                    <div className="w-8 h-px mb-4" style={{ backgroundColor: "#C8A96A" }} />
                    <p
                      className="font-script text-lg mb-4"
                      style={{ color: step.accentColor }}
                    >
                      {step.belief}
                    </p>
                    <p
                      className="text-sm font-sans leading-relaxed mb-6"
                      style={{ color: step.textColor, opacity: 0.82 }}
                    >
                      {step.teaching}
                    </p>

                    {showFull && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {step.prompts.map((prompt, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-sm font-sans"
                            style={{ color: step.textColor, opacity: 0.75 }}
                          >
                            <span
                              className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: "#C8A96A" }}
                            />
                            {prompt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
