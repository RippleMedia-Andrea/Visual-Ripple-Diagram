import { useState } from "react";

const steps = [
  {
    number: "01",
    id: "reveal",
    title: "Reveal",
    subtitle: "Your Story",
    belief: "Your story holds clues.",
    teaching:
      "You are uncovering who you already are. Start with two stories when you felt most like yourself. For each one, notice what you felt, what you did, and what changed.",
    prompts: [
      "Two stories when you felt most like yourself",
      "What I felt / What I did / What changed",
      "Optional: early experiences that shaped you",
      "Optional: challenges and turning points",
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
      "Your stories hold patterns. Look for the action you keep taking and the impact it has on others. Both carry equal weight, and your action is bigger than any single job or role.",
    prompts: [
      "Your action word, found in your stories",
      "Your impact on others",
      "Action and impact carry equal weight",
      "Bigger than any single job or role",
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
      "Your patterns point to a purpose that is uniquely yours. Put who you are into words. Your purpose statement names your action and the impact it has on others, in plain, everyday words.",
    prompts: [
      '"I wake up each day to [action]…"',
      '"…so that [impact]."',
      "Ask why more than once to go deeper on impact",
      "Plain, everyday words",
    ],
    color: "#2F7F7B",
    textColor: "#ffffff",
    accentColor: "#F5F1E8",
  },
  {
    number: "04",
    id: "personalize",
    title: "Picture",
    subtitle: "Your Vision",
    belief: "See the life your purpose makes possible.",
    teaching:
      "See the life your purpose makes possible, and notice whose picture of success you've been borrowing.",
    prompts: [
      "When I imagine living my purpose, what do I picture?",
      "Whose life did I get that picture from?",
      "What have I been telling myself I need before I can start living my season?",
    ],
    color: "#5FA8A5",
    textColor: "#0F2A36",
    accentColor: "#0F2A36",
  },
  {
    number: "05",
    id: "live",
    title: "Live",
    subtitle: "Your Season",
    belief: "Live your purpose right where you are.",
    teaching:
      "Your season is not the waiting room to your life. Live your purpose right where you are. The roles you carry today are where your purpose already shows up.",
    prompts: [
      "Right now I'm in the season of...",
      "The roles I'm carrying...",
      "Where is my purpose already showing up in this season?",
    ],
    color: "#9fd0cd",
    textColor: "#0F2A36",
    accentColor: "#0F2A36",
  },
  {
    number: "06",
    id: "expand",
    title: "Expand",
    subtitle: "Your Ripple",
    belief: "What's within you creates a ripple.",
    teaching:
      "Your ripple reaches the people around you and keeps growing. Your family, your community, and your work all feel it as you live from the inside out.",
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
