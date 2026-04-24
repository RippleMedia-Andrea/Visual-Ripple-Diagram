import { useState } from "react";

interface RingStage {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  radius: number;
  textRadius: number;
  fontSize: number;
  subtitleSize: number;
}

const stages: RingStage[] = [
  {
    id: "reveal",
    title: "Reveal",
    subtitle: "Your Story",
    description: "Begin with radical honesty. Uncover the narrative you've been living — the experiences, beliefs, and moments that have quietly shaped who you are today.",
    radius: 52,
    textRadius: 0,
    fontSize: 18,
    subtitleSize: 11,
  },
  {
    id: "identify",
    title: "Identify",
    subtitle: "Your Patterns",
    description: "Notice the recurring themes running through your life. These patterns — in relationships, work, and choices — hold the keys to your deepest growth.",
    radius: 108,
    textRadius: 82,
    fontSize: 13,
    subtitleSize: 9,
  },
  {
    id: "pinpoint",
    title: "Pinpoint",
    subtitle: "Your Purpose",
    description: "Discover the intersection of your gifts, passions, and the world's needs. Your purpose isn't something you find — it's something you uncover from within.",
    radius: 162,
    textRadius: 137,
    fontSize: 12,
    subtitleSize: 9,
  },
  {
    id: "personalize",
    title: "Personalize",
    subtitle: "Your Season",
    description: "Every purpose unfolds in seasons. What is this particular chapter of your life asking of you? Align your path with where you are right now.",
    radius: 216,
    textRadius: 190,
    fontSize: 11,
    subtitleSize: 8,
  },
  {
    id: "live",
    title: "Live",
    subtitle: "Your Ripple",
    description: "Step into intentional, purposeful living. Your daily choices, your presence, your work — all become expressions of your deepest truth.",
    radius: 268,
    textRadius: 244,
    fontSize: 11,
    subtitleSize: 8,
  },
  {
    id: "expand",
    title: "Expand",
    subtitle: "Your Growth",
    description: "Your ripple touches others. As you grow, you create space for those around you to grow too. This is where personal purpose becomes collective impact.",
    radius: 320,
    textRadius: 296,
    fontSize: 11,
    subtitleSize: 8,
  },
];

const ringColors = [
  { fill: "#0F2A36", stroke: "#1a3d4e" },
  { fill: "#1a4a55", stroke: "#2F7F7B" },
  { fill: "#2F7F7B", stroke: "#4a9a96" },
  { fill: "#5FA8A5", stroke: "#7bbfbc" },
  { fill: "#9fd0cd", stroke: "#b8e0de" },
  { fill: "#D7ECEB", stroke: "#c0dfde" },
];

interface Props {
  className?: string;
  size?: number;
}

export function RippleMethodDiagram({ className = "", size = 700 }: Props) {
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const cx = size / 2;
  const cy = size / 2;
  const scaleFactor = size / 700;

  const activeStageData = activeStage ? stages.find((s) => s.id === activeStage) : null;

  return (
    <div className={`flex flex-col items-center gap-8 ${className}`} data-testid="ripple-method-diagram">
      <div className="relative w-full max-w-[700px] mx-auto" style={{ aspectRatio: "1 / 1" }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full drop-shadow-xl"
          style={{ overflow: "visible" }}
          aria-label="Ripple Method Diagram"
        >
          <defs>
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D7ECEB" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F5F1E8" stopOpacity="0" />
            </radialGradient>
            <filter id="ringGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#0F2A36" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Ambient background glow */}
          <circle cx={cx} cy={cy} r={340 * scaleFactor} fill="url(#bgGlow)" />

          {/* Rings — rendered from outside to inside */}
          {[...stages].reverse().map((stage, reverseIdx) => {
            const idx = stages.length - 1 - reverseIdx;
            const color = ringColors[idx];
            const isActive = activeStage === stage.id;
            const isCenter = idx === 0;

            return (
              <g key={stage.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={stage.radius * scaleFactor}
                  fill={color.fill}
                  stroke={isActive ? "#C8A96A" : color.stroke}
                  strokeWidth={isActive ? 2.5 : 1}
                  opacity={isActive ? 1 : 0.92}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    filter: isActive ? "drop-shadow(0 0 12px rgba(200, 169, 106, 0.5))" : undefined,
                  }}
                  onClick={() => setActiveStage(isActive ? null : stage.id)}
                  data-testid={`ring-${stage.id}`}
                />

                {/* Subtle ripple shimmer line on each ring */}
                {!isCenter && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={(stage.radius - 4) * scaleFactor}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={1}
                  />
                )}
              </g>
            );
          })}

          {/* Text labels for each ring */}
          {stages.map((stage, idx) => {
            const isCenter = idx === 0;
            const isActive = activeStage === stage.id;
            const textColor = idx <= 2 ? "#ffffff" : "#0F2A36";
            const subtitleColor = idx <= 2 ? "rgba(255,255,255,0.7)" : "rgba(15,42,54,0.65)";

            if (isCenter) {
              return (
                <g
                  key={stage.id}
                  onClick={() => setActiveStage(isActive ? null : stage.id)}
                  style={{ cursor: "pointer" }}
                >
                  <text
                    x={cx}
                    y={cy - 7 * scaleFactor}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={textColor}
                    fontSize={stage.fontSize * scaleFactor}
                    fontFamily="'Playfair Display', serif"
                    fontWeight="600"
                    style={{ transition: "opacity 0.2s" }}
                    opacity={isActive ? 1 : 0.9}
                  >
                    {stage.title}
                  </text>
                  <text
                    x={cx}
                    y={cy + 10 * scaleFactor}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={subtitleColor}
                    fontSize={stage.subtitleSize * scaleFactor}
                    fontFamily="'Poppins', sans-serif"
                    fontWeight="400"
                    letterSpacing="0.08em"
                    style={{ textTransform: "uppercase" }}
                  >
                    {stage.subtitle}
                  </text>
                </g>
              );
            }

            const midRadius = stage.textRadius * scaleFactor;
            const angle = -Math.PI / 2;
            const tx = cx + midRadius * Math.cos(angle);
            const ty = cy + midRadius * Math.sin(angle);

            return (
              <g
                key={stage.id}
                onClick={() => setActiveStage(isActive ? null : stage.id)}
                style={{ cursor: "pointer" }}
              >
                <text
                  x={tx}
                  y={ty - 5 * scaleFactor}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isActive ? "#C8A96A" : textColor}
                  fontSize={stage.fontSize * scaleFactor}
                  fontFamily="'Playfair Display', serif"
                  fontWeight="500"
                  style={{ transition: "fill 0.2s" }}
                >
                  {stage.title}
                </text>
                <text
                  x={tx}
                  y={ty + 7 * scaleFactor}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={subtitleColor}
                  fontSize={stage.subtitleSize * scaleFactor}
                  fontFamily="'Poppins', sans-serif"
                  fontWeight="400"
                  letterSpacing="0.07em"
                >
                  {stage.subtitle.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Gold accent dot at center */}
          <circle cx={cx} cy={cy} r={4 * scaleFactor} fill="#C8A96A" opacity="0.9" />
        </svg>

        {/* Hover/click tooltip overlay */}
        {activeStageData && (
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-4 z-10 w-full max-w-xs"
            data-testid="stage-description"
          >
            <div className="mt-4 bg-white/90 backdrop-blur-sm border border-[#D7ECEB] rounded-2xl shadow-lg px-6 py-5 text-center">
              <div className="text-[#C8A96A] text-xs font-sans font-500 uppercase tracking-widest mb-1">
                {activeStageData.subtitle}
              </div>
              <div
                className="text-[#0F2A36] font-serif text-lg font-semibold mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {activeStageData.title}
              </div>
              <div className="gold-divider my-2" />
              <p className="text-[#2F7F7B] text-sm leading-relaxed font-sans">
                {activeStageData.description}
              </p>
              <button
                onClick={() => setActiveStage(null)}
                className="mt-3 text-xs text-[#5FA8A5] hover:text-[#2F7F7B] transition-colors"
                data-testid="close-description"
              >
                close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tagline */}
      <div className="text-center mt-4" data-testid="ripple-tagline">
        <div className="gold-divider w-32 mx-auto mb-4" />
        <p className="font-script text-xl text-[#2F7F7B]">What's within you creates a ripple.</p>
        <div className="gold-divider w-32 mx-auto mt-4" />
      </div>

      {/* Stage legend below on mobile */}
      <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-md" data-testid="stage-legend">
        {stages.map((stage, idx) => (
          <button
            key={stage.id}
            onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
            data-testid={`legend-${stage.id}`}
            className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-all duration-200 border ${
              activeStage === stage.id
                ? "bg-[#2F7F7B] text-white border-[#2F7F7B] shadow-md"
                : "bg-white/60 text-[#0F2A36] border-[#D7ECEB] hover:bg-[#D7ECEB] hover:border-[#5FA8A5]"
            }`}
          >
            {stage.title} · {stage.subtitle}
          </button>
        ))}
      </div>
    </div>
  );
}
