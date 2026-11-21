import { useState } from "react";
import { Link } from "wouter";
import rippleLabsLogo from "@assets/2876A1D3-1596-40F7-9384-F5AAA5F311E8_1777042604510.png";
import purposeLabLogo from "@assets/31DC4C16-212D-406B-AC0B-609119CF0477_1777042604510.png";
import { RippleMethodDiagram } from "@/components/RippleMethodDiagram";
import { PurposeStatementBuilder } from "@/components/PurposeStatementBuilder";
import { STAGE_DESCRIPTIONS } from "@/lib/stage-descriptions";

const stages = [
  {
    number: "01",
    id: "reveal",
    title: "Reveal",
    subtitle: "Your Story",
    eyebrow: "Stage One",
    belief: "Your story holds clues.",
    teaching: STAGE_DESCRIPTIONS.reveal,
    what: "In this stage you'll share two stories when you felt most like yourself. For each one, you'll reflect on three things: What I felt, What I did, and What changed. The other prompts are optional extras.",
    prompts: [
      {
        label: "Story One",
        question:
          "Tell a story when you felt most like yourself. What I felt? What I did? What changed?",
      },
      {
        label: "Story Two",
        question:
          "Tell a second story when you felt most like yourself. What I felt? What I did? What changed?",
      },
      {
        label: "Optional: Early Experiences",
        question:
          "What experiences from childhood or early life shaped how you see yourself and others?",
      },
      {
        label: "Optional: Turning Points",
        question:
          "Describe a moment when everything shifted. What was before, and what became possible after?",
      },
    ],
    color: "#0B1F4B",
    textColor: "#ffffff",
    bg: "#0B1F4B",
    cardBg: "rgba(255,255,255,0.06)",
  },
  {
    number: "02",
    id: "identify",
    title: "Identify",
    subtitle: "Your Patterns",
    eyebrow: "Stage Two",
    belief: "Patterns reveal purpose.",
    teaching: STAGE_DESCRIPTIONS.identify,
    what: "Here you'll find your action word and your impact from your stories. Both carry equal weight, and your action is bigger than any single job or role.",
    prompts: [
      {
        label: "Your Action Word",
        question:
          "Looking at your two stories, what were you doing each time? Choose one word for the action you keep taking.",
      },
      {
        label: "Your Impact",
        question:
          "In those same stories, what changed for the people around you because of what you did?",
      },
      {
        label: "Equal Weight",
        question:
          "Read your action and your impact side by side. Do they feel equally true to who you are?",
      },
      {
        label: "Beyond One Role",
        question:
          "Where else does your action show up, outside of work or any single role you hold?",
      },
    ],
    color: "#16306A",
    textColor: "#ffffff",
    bg: "#16306A",
    cardBg: "rgba(255,255,255,0.06)",
  },
  {
    number: "03",
    id: "pinpoint",
    title: "Pinpoint",
    subtitle: "Your Purpose",
    eyebrow: "Stage Three",
    belief: "You are not becoming someone else. You are naming who you already are.",
    teaching: STAGE_DESCRIPTIONS.pinpoint,
    what: "Using your action and impact, you'll write your purpose statement. A suggested form is: \"I wake up each day to [action] so that [impact].\" The form is optional. An action and an outward impact are what matter.",
    prompts: [
      {
        label: "The Action",
        question:
          "What do you naturally do? Think about repeated behaviors, strengths, and patterns from your stories. What shows up again and again?",
      },
      {
        label: "The Impact",
        question:
          "How are others affected by you? What changes because of you? What difference do you naturally create in people's lives?",
      },
      {
        label: "Ask Why",
        question:
          "Look at your impact and ask, why does that matter? Then ask why again. Keep going until it feels true.",
      },
      {
        label: "Is It Other-Centered?",
        question:
          "Does your impact focus outward, on what others gain or experience because of who you are?",
      },
    ],
    color: "#1E3A6E",
    textColor: "#ffffff",
    bg: "#1E3A6E",
    cardBg: "rgba(255,255,255,0.08)",
  },
  {
    number: "04",
    id: "personalize",
    title: "Picture",
    subtitle: "Your Vision",
    eyebrow: "Stage Four",
    belief: "See the life your purpose makes possible.",
    teaching: STAGE_DESCRIPTIONS.picture,
    what: "In this stage, you'll picture what living your purpose looks like and make sure that picture is truly yours.",
    prompts: [
      {
        label: "Your Picture",
        question:
          "When I imagine living my purpose, what do I picture?",
      },
      {
        label: "Where It Came From",
        question:
          "Whose life did I get that picture from?",
      },
      {
        label: "Ready Now",
        question:
          "What have I been telling myself I need before I can start living my season?",
      },
    ],
    color: "#5A6B8C",
    textColor: "#0B1F4B",
    bg: "#5A6B8C",
    cardBg: "rgba(11,31,75,0.06)",
  },
  {
    number: "05",
    id: "live",
    title: "Live",
    subtitle: "Your Season",
    eyebrow: "Stage Five",
    belief: "Live your purpose right where you are.",
    teaching: STAGE_DESCRIPTIONS.live,
    what: "In this stage, you'll name the season you are in, the roles you carry, and where your purpose is already showing up.",
    prompts: [
      {
        label: "Your Season",
        question:
          "Right now I'm in the season of...",
      },
      {
        label: "Your Roles",
        question:
          "The roles I'm carrying...",
      },
      {
        label: "Already Showing Up",
        question:
          "Where is my purpose already showing up in this season?",
      },
    ],
    color: "#B9C3D9",
    textColor: "#0B1F4B",
    bg: "#B9C3D9",
    cardBg: "rgba(11,31,75,0.06)",
  },
  {
    number: "06",
    id: "expand",
    title: "Expand",
    subtitle: "Your Ripple",
    eyebrow: "Stage Six",
    belief: "What's within you creates a ripple.",
    teaching: STAGE_DESCRIPTIONS.expand,
    what: "This final stage is about integration: building daily rhythms that keep you connected to your purpose, and setting the intention to return in future seasons as life changes.",
    prompts: [
      {
        label: "Morning Intention",
        question:
          "How will you begin each morning with an intention rooted in your purpose? What does a purposeful morning look like for you?",
      },
      {
        label: "Evening Reflection",
        question:
          "At the end of each day, what question will you ask yourself to stay connected to what matters most?",
      },
      {
        label: "Your Ripple",
        question:
          "Who in your life is most impacted by you living from your purpose? What changes for them as you live your purpose fully?",
      },
      {
        label: "The Next Season",
        question:
          "Purpose Lab is designed to be revisited. When your season changes, what will you return to explore?",
      },
    ],
    color: "#EEE9DB",
    textColor: "#0B1F4B",
    bg: "#EEE9DB",
    cardBg: "rgba(11,31,75,0.05)",
  },
];

function StageProgress({ activeId }: { activeId: string }) {
  return (
    <div
      className="flex items-center gap-1 overflow-x-auto pb-1"
      data-testid="stage-progress"
    >
      {stages.map((stage, idx) => {
        const isActive = stage.id === activeId;
        const isPast =
          stages.findIndex((s) => s.id === activeId) > idx;

        return (
          <div key={stage.id} className="flex items-center gap-1 flex-shrink-0">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-all ${
                isActive
                  ? "text-white shadow-sm"
                  : isPast
                  ? "text-[#5A6B8C]"
                  : "text-[#5A6B8C] opacity-80"
              }`}
              style={{
                backgroundColor: isActive ? stage.color : "transparent",
              }}
              data-testid={`progress-${stage.id}`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                  isActive
                    ? "bg-white/20 border-white/30 text-white"
                    : isPast
                    ? "border-[#1E3A6E] text-[#1E3A6E]"
                    : "border-current"
                }`}
              >
                {isPast ? "✓" : stage.number}
              </span>
              <span className="hidden sm:inline">{stage.title}</span>
            </div>
            {idx < stages.length - 1 && (
              <div
                className={`w-3 h-px flex-shrink-0 ${
                  isPast ? "bg-[#1E3A6E]" : "bg-[#EDE4CC]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PurposeLab() {
  const [activeStageId, setActiveStageId] = useState("reveal");
  const activeStage = stages.find((s) => s.id === activeStageId)!;
  const activeIdx = stages.findIndex((s) => s.id === activeStageId);

  const goNext = () => {
    if (activeIdx < stages.length - 1) setActiveStageId(stages[activeIdx + 1].id);
  };
  const goPrev = () => {
    if (activeIdx > 0) setActiveStageId(stages[activeIdx - 1].id);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F5F1E8" }}
      data-testid="purpose-lab-page"
    >
      {/* Nav */}
      <nav
        className="w-full px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 z-50"
        style={{ backgroundColor: "#0B1F4B" }}
        data-testid="nav"
      >
        <Link href="/">
          <img
            src={rippleLabsLogo}
            alt="Ripple Labs"
            className="h-8 w-auto object-contain rounded-md cursor-pointer"
            data-testid="nav-logo"
          />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-[#EDE4CC] text-xs font-sans hover:text-[#C9A84C] transition-colors"
            data-testid="nav-home"
          >
            ← Home
          </Link>
          <Link
            href="/ripple-method"
            className="text-[#EDE4CC] text-xs font-sans hover:text-[#C9A84C] transition-colors hidden sm:inline"
            data-testid="nav-ripple-method"
          >
            The Ripple Method™
          </Link>
        </div>
      </nav>

      {/* Purpose Lab Hero */}
      <section
        className="px-6 md:px-12 py-16 md:py-20 text-center"
        style={{ backgroundColor: "#0B1F4B" }}
        data-testid="purpose-lab-hero"
      >
        <div className="max-w-2xl mx-auto">
          <img
            src={purposeLabLogo}
            alt="Purpose Lab"
            className="w-28 h-28 object-contain mx-auto mb-6 rounded-2xl"
            data-testid="purpose-lab-hero-logo"
          />
          <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-3">
            A Ripple Labs Experience
          </p>
          <h1
            className="text-3xl md:text-5xl font-serif font-semibold text-white mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
            data-testid="purpose-lab-hero-heading"
          >
            Purpose Lab
          </h1>
          <div className="gold-divider w-24 mx-auto my-5" />
          <p className="font-script text-xl text-[#EDE4CC] mb-4">
            Uncover who you are. Live your purpose. Love your life.
          </p>
          <p className="text-[#B9C3D9] font-sans text-sm leading-relaxed max-w-lg mx-auto">
            Purpose Lab is a guided journey through The Ripple Method, a six-stage process
            that helps you move from your story to your purpose, and from your purpose to
            a life you love living.
          </p>
        </div>
      </section>

      {/* The Approach — Ripple Method Overview */}
      <section
        className="px-6 md:px-12 py-16"
        style={{ backgroundColor: "#EEE9DB" }}
        data-testid="approach-section"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-3">
              The Approach
            </p>
            <h2
              className="text-3xl font-serif font-semibold text-[#0B1F4B] mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="approach-heading"
            >
              Built on The Ripple Method
            </h2>
            <p className="text-[#5A6B8C] font-sans text-sm leading-relaxed max-w-xl mx-auto">
              Purpose is not something you create. It is something already within you
              that you uncover, name, and live. The Ripple Method is the framework
              that guides that journey: six stages, moving from your innermost story
              to your outermost impact.
            </p>
          </div>

          {/* Horizontal stage flow */}
          <div className="relative">
            {/* Connecting line */}
            <div
              className="hidden md:block absolute top-[26px] left-[calc(8.33%+26px)] right-[calc(8.33%+26px)] h-px z-0"
              style={{
                background:
                  "linear-gradient(to right, #0B1F4B, #16306A, #1E3A6E, #5A6B8C, #B9C3D9, #C9A84C)",
              }}
            />
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 relative z-10 mb-10">
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  data-testid={`approach-step-${stage.id}`}
                  className="flex flex-col items-center text-center group"
                >
                  <div
                    className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-sm font-sans font-semibold mb-2 transition-all duration-200 border-2 ${
                      activeStageId === stage.id
                        ? "scale-110 shadow-lg border-[#C9A84C]"
                        : "scale-100 border-transparent group-hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: stage.color,
                      color: stage.textColor,
                    }}
                  >
                    {stage.number}
                  </div>
                  <p
                    className={`text-xs font-serif font-semibold ${
                      activeStageId === stage.id ? "text-[#1E3A6E]" : "text-[#0B1F4B]"
                    }`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {stage.title}
                  </p>
                  <p className="text-[9px] font-sans uppercase tracking-wider text-[#5A6B8C] mt-0.5">
                    {stage.subtitle}
                  </p>
                </button>
              ))}
            </div>

            {/* Teaching card for selected stage */}
            <div
              className="rounded-2xl overflow-hidden shadow-md"
              style={{ backgroundColor: activeStage.bg }}
              data-testid="approach-detail-card"
            >
              <div className="px-8 py-8">
                <div className="max-w-2xl mx-auto">
                  <p
                    className="text-xs font-sans uppercase tracking-widest mb-1"
                    style={{ color: activeStage.textColor, opacity: 0.5 }}
                  >
                    {activeStage.eyebrow}
                  </p>
                  <h3
                    className="text-2xl font-serif font-semibold mb-1"
                    style={{
                      color: activeStage.textColor,
                      fontFamily: "'Playfair Display', serif",
                    }}
                  >
                    {activeStage.title} · {activeStage.subtitle}
                  </h3>
                  <div className="w-8 h-px mb-4" style={{ backgroundColor: "#C9A84C" }} />
                  <p
                    className="font-script text-lg mb-3"
                    style={{
                      color: activeStage.textColor,
                      opacity: 0.85,
                    }}
                  >
                    {activeStage.belief}
                  </p>
                  <p
                    className="text-sm font-sans leading-relaxed"
                    style={{ color: activeStage.textColor, opacity: 0.75 }}
                  >
                    {activeStage.what}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Circular diagram */}
          <div className="mt-16 text-center">
            <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-8">
              The Full Picture
            </p>
            <RippleMethodDiagram size={580} />
          </div>
        </div>
      </section>

      {/* The Guided Journey — Stage by Stage */}
      <section
        className="px-6 md:px-12 py-16"
        style={{ backgroundColor: "#F5F1E8" }}
        data-testid="guided-journey-section"
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-3">
              Your Guided Journey
            </p>
            <h2
              className="text-3xl font-serif font-semibold text-[#0B1F4B] mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="journey-heading"
            >
              Move Through Each Stage
            </h2>
            <p className="text-[#5A6B8C] font-sans text-sm leading-relaxed">
              Each stage of Purpose Lab is a guided experience. Explore them below.
            </p>
          </div>

          {/* Progress bar */}
          <div
            className="mb-8 p-3 rounded-2xl overflow-x-auto"
            style={{ backgroundColor: "#EEE9DB" }}
          >
            <StageProgress activeId={activeStageId} />
          </div>

          {/* Active stage content */}
          <div
            className="rounded-3xl overflow-hidden shadow-lg"
            data-testid={`stage-content-${activeStageId}`}
            style={{ backgroundColor: activeStage.bg }}
          >
            {/* Stage header */}
            <div className="px-8 pt-10 pb-6">
              <p
                className="text-xs font-sans uppercase tracking-widest mb-1"
                style={{ color: activeStage.textColor, opacity: 0.5 }}
              >
                {activeStage.eyebrow} · The Ripple Method
              </p>
              <h2
                className="text-3xl md:text-4xl font-serif font-semibold mb-1"
                style={{
                  color: activeStage.textColor,
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                {activeStage.title}
              </h2>
              <p
                className="text-xs font-sans uppercase tracking-widest"
                style={{ color: activeStage.textColor, opacity: 0.5 }}
              >
                {activeStage.subtitle}
              </p>
            </div>

            {/* Gold divider */}
            <div className="px-8">
              <div className="h-px" style={{ backgroundColor: "#C9A84C", opacity: 0.4 }} />
            </div>

            {/* Belief + Teaching */}
            <div className="px-8 py-7">
              <p
                className="font-script text-xl mb-4"
                style={{ color: activeStage.textColor, opacity: 0.9 }}
              >
                {activeStage.belief}
              </p>
              <p
                className="text-sm font-sans leading-relaxed"
                style={{ color: activeStage.textColor, opacity: 0.78 }}
              >
                {activeStage.teaching}
              </p>
            </div>

            {/* What you'll do */}
            <div
              className="mx-6 mb-6 px-6 py-5 rounded-xl"
              style={{ backgroundColor: activeStage.cardBg }}
            >
              <p
                className="text-xs font-sans uppercase tracking-widest mb-2"
                style={{ color: activeStage.textColor, opacity: 0.5 }}
              >
                In This Stage
              </p>
              <p
                className="text-sm font-sans leading-relaxed"
                style={{ color: activeStage.textColor, opacity: 0.72 }}
              >
                {activeStage.what}
              </p>
            </div>

            {/* Purpose Statement Builder — Pinpoint stage only */}
            {activeStageId === "pinpoint" && (
              <div className="px-8 pb-6" data-testid="purpose-statement-builder-section">
                <p
                  className="text-xs font-sans uppercase tracking-widest mb-4"
                  style={{ color: activeStage.textColor, opacity: 0.5 }}
                >
                  Build Your Purpose Statement
                </p>
                <PurposeStatementBuilder
                  textColor={activeStage.textColor}
                  cardBg={activeStage.cardBg}
                />
              </div>
            )}

            {/* Reflection prompts */}
            <div className="px-8 pb-10">
              <p
                className="text-xs font-sans uppercase tracking-widest mb-4"
                style={{ color: activeStage.textColor, opacity: 0.5 }}
              >
                Reflection Prompts
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeStage.prompts.map((prompt, i) => (
                  <div
                    key={i}
                    className="px-5 py-4 rounded-xl"
                    style={{ backgroundColor: activeStage.cardBg }}
                    data-testid={`prompt-card-${i}`}
                  >
                    <div
                      className="w-4 h-px mb-2"
                      style={{ backgroundColor: "#C9A84C" }}
                    />
                    <p
                      className="text-xs font-sans font-semibold uppercase tracking-wide mb-2"
                      style={{ color: activeStage.textColor, opacity: 0.55 }}
                    >
                      {prompt.label}
                    </p>
                    <p
                      className="text-sm font-sans leading-relaxed"
                      style={{ color: activeStage.textColor, opacity: 0.8 }}
                    >
                      {prompt.question}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div
              className="px-8 py-5 flex items-center justify-between"
              style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
            >
              <button
                onClick={goPrev}
                disabled={activeIdx === 0}
                className="flex items-center gap-2 text-xs font-sans font-medium transition-all disabled:opacity-30"
                style={{ color: activeStage.textColor }}
                data-testid="stage-prev"
              >
                ← {activeIdx > 0 ? `Back to ${stages[activeIdx - 1].title}` : "Beginning"}
              </button>
              <span
                className="text-xs font-sans opacity-40"
                style={{ color: activeStage.textColor }}
              >
                {activeStage.number} of 06
              </span>
              <button
                onClick={goNext}
                disabled={activeIdx === stages.length - 1}
                className="flex items-center gap-2 text-xs font-sans font-medium transition-all disabled:opacity-30"
                style={{ color: activeStage.textColor }}
                data-testid="stage-next"
              >
                {activeIdx < stages.length - 1
                  ? `Next: ${stages[activeIdx + 1].title}`
                  : "Complete"} →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Key teachings strip */}
      <section
        className="px-6 md:px-12 py-14"
        style={{ backgroundColor: "#0B1F4B" }}
        data-testid="teachings-section"
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-8">
            Core Teachings
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "You are not becoming someone else. You are uncovering who you already are.",
              "Your story holds clues.",
              "Patterns reveal purpose.",
              "Purpose is not something you create. It is something you recognize, name, and live.",
              "Your season is not the waiting room to your life.",
              "What's within you creates a ripple.",
            ].map((teaching, i) => (
              <div
                key={i}
                className="px-5 py-5 rounded-xl border"
                style={{
                  backgroundColor: "rgba(237,228,204,0.05)",
                  borderColor: "rgba(237,228,204,0.1)",
                }}
                data-testid={`teaching-${i}`}
              >
                <div className="w-6 h-px mb-3 mx-auto" style={{ backgroundColor: "#C9A84C" }} />
                <p className="font-script text-base text-[#EDE4CC] leading-relaxed">
                  {teaching}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="px-6 py-16 text-center"
        style={{ backgroundColor: "#EEE9DB" }}
        data-testid="purpose-lab-cta-section"
      >
        <div className="max-w-lg mx-auto">
          <img
            src={purposeLabLogo}
            alt="Purpose Lab"
            className="w-20 h-20 object-contain mx-auto mb-5"
            data-testid="cta-logo"
          />
          <h2
            className="text-2xl font-serif font-semibold text-[#0B1F4B] mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Ready to begin?
          </h2>
          <p className="text-[#5A6B8C] font-sans text-sm leading-relaxed mb-6">
            Small actions create a life of purpose. Your journey through Purpose Lab
            starts with a single story.
          </p>
          <Link
            href="/ripple-journey"
            className="inline-block px-9 py-3.5 rounded-full font-sans font-medium text-white transition-all shadow-md hover:shadow-lg hover:opacity-90"
            style={{ backgroundColor: "#1E3A6E" }}
            data-testid="begin-journey-btn"
          >
            Begin Your Journey →
          </Link>
          <p className="text-[#1E3A6E] font-sans text-xs leading-relaxed mt-4 max-w-sm mx-auto" data-testid="text-course-buyer">
            Bought the course? Sign up with the same email you used and your access is already waiting.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: "#071433" }}
        data-testid="footer"
      >
        <img
          src={rippleLabsLogo}
          alt="Ripple Labs"
          className="h-7 w-auto object-contain brightness-0 invert opacity-60"
          data-testid="footer-logo"
        />
        <p className="text-[#B9C3D9] text-xs font-sans text-center">
          © {new Date().getFullYear()} Ripple Labs · Purpose Lab
        </p>
        <div className="flex gap-5">
          <Link href="/" className="text-[#EDE4CC] text-xs font-sans hover:text-[#C9A84C] transition-colors">
            Home
          </Link>
          <Link href="/privacy" className="text-[#EDE4CC] text-xs font-sans hover:text-[#C9A84C] transition-colors">Privacy</Link>
          <Link href="/terms" className="text-[#EDE4CC] text-xs font-sans hover:text-[#C9A84C] transition-colors">Terms</Link>
          <Link href="/support" className="text-[#EDE4CC] text-xs font-sans hover:text-[#C9A84C] transition-colors">Support</Link>
        </div>
      </footer>
    </div>
  );
}
