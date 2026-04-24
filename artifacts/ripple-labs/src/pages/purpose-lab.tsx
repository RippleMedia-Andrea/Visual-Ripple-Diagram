import { useState } from "react";
import { Link } from "wouter";
import rippleLabsLogo from "@assets/2876A1D3-1596-40F7-9384-F5AAA5F311E8_1777042604510.png";
import purposeLabLogo from "@assets/31DC4C16-212D-406B-AC0B-609119CF0477_1777042604510.png";
import { RippleMethodDiagram } from "@/components/RippleMethodDiagram";

const stages = [
  {
    number: "01",
    id: "reveal",
    title: "Reveal",
    subtitle: "Your Story",
    eyebrow: "Stage One",
    belief: "Your story holds clues.",
    teaching:
      "You are not becoming someone else. You are uncovering who you already are. Every meaningful experience — the highs, the lows, the moments that made you come alive — contains a thread of your purpose. We begin here, with your story.",
    what: "In this stage you'll uncover meaningful stories, early experiences, moments of aliveness, challenges, and defining memories that have quietly shaped who you are.",
    prompts: [
      {
        label: "Moments of Aliveness",
        question:
          "When in your life have you felt most alive, most yourself? What were you doing? Who were you with?",
      },
      {
        label: "Early Experiences",
        question:
          "What experiences from childhood or early life shaped how you see yourself and others?",
      },
      {
        label: "Defining Challenges",
        question:
          "What is a difficulty you've walked through that changed you? What did it reveal about your strength or values?",
      },
      {
        label: "Turning Points",
        question:
          "Describe a moment when everything shifted. What was before, and what became possible after?",
      },
    ],
    color: "#0F2A36",
    textColor: "#ffffff",
    bg: "#0F2A36",
    cardBg: "rgba(255,255,255,0.06)",
  },
  {
    number: "02",
    id: "identify",
    title: "Identify",
    subtitle: "Your Patterns",
    eyebrow: "Stage Two",
    belief: "Patterns reveal purpose.",
    teaching:
      "Across your stories, there are recurring themes — emotions you keep feeling, actions you naturally take, values that keep surfacing. These patterns are not coincidences. They are fingerprints of your purpose.",
    what: "Here we extract the patterns from your stories: the emotions, actions, values, strengths, audience, motivations, and recurring themes that appear again and again.",
    prompts: [
      {
        label: "Recurring Emotions",
        question:
          "What emotions show up most in your best stories? (e.g., joy, purpose, freedom, connection, courage)",
      },
      {
        label: "Natural Strengths",
        question:
          "What do people consistently come to you for? What feels effortless to you but hard for others?",
      },
      {
        label: "Who You Impact",
        question:
          "Who do you most naturally want to help, support, or champion? Describe them.",
      },
      {
        label: "What Drives You",
        question:
          "What injustice bothers you most? What gap in the world do you wish you could fill?",
      },
    ],
    color: "#1a4a55",
    textColor: "#ffffff",
    bg: "#1a4a55",
    cardBg: "rgba(255,255,255,0.06)",
  },
  {
    number: "03",
    id: "pinpoint",
    title: "Pinpoint",
    subtitle: "Your Purpose",
    eyebrow: "Stage Three",
    belief: "Purpose is who you are in motion.",
    teaching:
      "Your patterns point to a purpose that is uniquely yours. Not a career title or a role — a clear, simple statement that names the action you were made to take and the impact you were made to create.",
    what: "Using the patterns you've identified, you'll craft your personal purpose statement. Purpose always ends with its impact on others.",
    prompts: [
      {
        label: "The Purpose Statement",
        question:
          '"I wake up every day to [action] so that [impact]." What would yours say?',
      },
      {
        label: "The Action",
        question:
          "What is the core action at the heart of your purpose? (e.g., create, teach, build, heal, connect, lead, challenge)",
      },
      {
        label: "The Impact",
        question:
          "Who benefits from your purpose, and what does it make possible for them?",
      },
      {
        label: "The Test",
        question:
          "When you read your purpose statement, does it feel like a relief — like something you've always known but never said out loud?",
      },
    ],
    color: "#2F7F7B",
    textColor: "#ffffff",
    bg: "#2F7F7B",
    cardBg: "rgba(255,255,255,0.08)",
  },
  {
    number: "04",
    id: "personalize",
    title: "Personalize",
    subtitle: "Your Season",
    eyebrow: "Stage Four",
    belief: "Your purpose is not limited by your season. It is expressed through it.",
    teaching:
      "Purpose remains constant, but how it shows up changes with each chapter of your life. Your current roles, responsibilities, capacity, and constraints don't box in your purpose — they give it shape right now.",
    what: "In this stage, you'll apply your purpose to the specific season you are in — mapping how it shows up through the roles you carry today.",
    prompts: [
      {
        label: "Your Current Season",
        question:
          "What season of life are you in right now? (e.g., young family, career transition, empty nest, recovery, new beginning)",
      },
      {
        label: "Your Current Roles",
        question:
          "What are the main roles you carry in this season? (e.g., parent, partner, professional, caregiver, leader)",
      },
      {
        label: "Purpose in Each Role",
        question:
          "How does your purpose statement express itself within each of your current roles? What does it look like in practice?",
      },
      {
        label: "Your Capacity",
        question:
          "Given your bandwidth right now, what is the simplest, most faithful expression of your purpose today?",
      },
    ],
    color: "#5FA8A5",
    textColor: "#0F2A36",
    bg: "#5FA8A5",
    cardBg: "rgba(15,42,54,0.06)",
  },
  {
    number: "05",
    id: "live",
    title: "Live",
    subtitle: "Your Ripple",
    eyebrow: "Stage Five",
    belief: "Small actions create a life of purpose.",
    teaching:
      "Purpose lived out is not grand gestures or waiting for the perfect moment. It is the accumulation of small, intentional choices. Some things need to begin. Some things need to stop. Some things are already working — and deserve to continue.",
    what: "Using Start / Stop / Continue, you'll create aligned action steps that make your purpose visible in everyday life.",
    prompts: [
      {
        label: "Start",
        question:
          "What is one thing you need to begin — an action, habit, or relationship — that aligns with your purpose?",
      },
      {
        label: "Stop",
        question:
          "What is currently draining you, misaligned with your purpose, or getting in the way of who you're meant to be?",
      },
      {
        label: "Continue",
        question:
          "What is already working? What practices, relationships, or actions are already expressing your purpose?",
      },
      {
        label: "This Week",
        question:
          "What is the one, small, specific thing you will do this week to live more intentionally from your purpose?",
      },
    ],
    color: "#9fd0cd",
    textColor: "#0F2A36",
    bg: "#9fd0cd",
    cardBg: "rgba(15,42,54,0.06)",
  },
  {
    number: "06",
    id: "expand",
    title: "Expand",
    subtitle: "Your Growth",
    eyebrow: "Stage Six",
    belief: "What's within you creates a ripple.",
    teaching:
      "As you live from purpose, your life creates a ripple — one that touches your family, your community, your work. Growth is not a destination. It is the natural result of living from the inside out, day after day, season after season.",
    what: "This final stage is about integration — building daily rhythms that keep you connected to your purpose, and setting the intention to return in future seasons as life changes.",
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
          "Who in your life is most impacted by you living from your purpose? What changes for them when you are at your best?",
      },
      {
        label: "The Next Season",
        question:
          "Purpose Lab is designed to be revisited. When your season changes, what will you return to explore?",
      },
    ],
    color: "#EEE9DB",
    textColor: "#0F2A36",
    bg: "#EEE9DB",
    cardBg: "rgba(15,42,54,0.05)",
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
                  ? "text-[#5FA8A5]"
                  : "text-[#5FA8A5] opacity-40"
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
                    ? "border-[#2F7F7B] text-[#2F7F7B]"
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
                  isPast ? "bg-[#2F7F7B]" : "bg-[#D7ECEB]"
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
        style={{ backgroundColor: "#0F2A36" }}
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
            className="text-[#D7ECEB] text-xs font-sans hover:text-[#C8A96A] transition-colors"
            data-testid="nav-home"
          >
            ← Home
          </Link>
          <Link
            href="/ripple-method"
            className="text-[#D7ECEB] text-xs font-sans hover:text-[#C8A96A] transition-colors hidden sm:inline"
            data-testid="nav-ripple-method"
          >
            The Ripple Method™
          </Link>
        </div>
      </nav>

      {/* Purpose Lab Hero */}
      <section
        className="px-6 md:px-12 py-16 md:py-20 text-center"
        style={{ backgroundColor: "#0F2A36" }}
        data-testid="purpose-lab-hero"
      >
        <div className="max-w-2xl mx-auto">
          <img
            src={purposeLabLogo}
            alt="Purpose Lab"
            className="w-28 h-28 object-contain mx-auto mb-6 rounded-2xl"
            data-testid="purpose-lab-hero-logo"
          />
          <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-3">
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
          <p className="font-script text-xl text-[#D7ECEB] mb-4">
            Uncover who you are. Live your purpose. Love your life.
          </p>
          <p className="text-[#9fd0cd] font-sans text-sm leading-relaxed max-w-lg mx-auto">
            Purpose Lab is a guided journey through The Ripple Method — a six-stage process
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
            <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-3">
              The Approach
            </p>
            <h2
              className="text-3xl font-serif font-semibold text-[#0F2A36] mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="approach-heading"
            >
              Built on The Ripple Method
            </h2>
            <p className="text-[#5FA8A5] font-sans text-sm leading-relaxed max-w-xl mx-auto">
              Purpose is not something you create. It is something already within you
              that you uncover, name, and live. The Ripple Method is the framework
              that guides that journey — six stages, moving from your innermost story
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
                  "linear-gradient(to right, #0F2A36, #1a4a55, #2F7F7B, #5FA8A5, #9fd0cd, #C8A96A)",
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
                        ? "scale-110 shadow-lg border-[#C8A96A]"
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
                      activeStageId === stage.id ? "text-[#2F7F7B]" : "text-[#0F2A36]"
                    }`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {stage.title}
                  </p>
                  <p className="text-[9px] font-sans uppercase tracking-wider text-[#5FA8A5] mt-0.5">
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
                    {activeStage.title} — {activeStage.subtitle}
                  </h3>
                  <div className="w-8 h-px mb-4" style={{ backgroundColor: "#C8A96A" }} />
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
            <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-8">
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
            <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-3">
              Your Guided Journey
            </p>
            <h2
              className="text-3xl font-serif font-semibold text-[#0F2A36] mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="journey-heading"
            >
              Move Through Each Stage
            </h2>
            <p className="text-[#5FA8A5] font-sans text-sm leading-relaxed">
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
              <div className="h-px" style={{ backgroundColor: "#C8A96A", opacity: 0.4 }} />
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
                      style={{ backgroundColor: "#C8A96A" }}
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
        style={{ backgroundColor: "#0F2A36" }}
        data-testid="teachings-section"
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-8">
            Core Teachings
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "You are not becoming someone else. You are uncovering who you already are.",
              "Your story holds clues.",
              "Patterns reveal purpose.",
              "Purpose is who you are in motion.",
              "Your purpose is not limited by your season. It is expressed through it.",
              "What's within you creates a ripple.",
            ].map((teaching, i) => (
              <div
                key={i}
                className="px-5 py-5 rounded-xl border"
                style={{
                  backgroundColor: "rgba(215,236,235,0.05)",
                  borderColor: "rgba(215,236,235,0.1)",
                }}
                data-testid={`teaching-${i}`}
              >
                <div className="w-6 h-px mb-3 mx-auto" style={{ backgroundColor: "#C8A96A" }} />
                <p className="font-script text-base text-[#D7ECEB] leading-relaxed">
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
            className="text-2xl font-serif font-semibold text-[#0F2A36] mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Ready to begin?
          </h2>
          <p className="text-[#5FA8A5] font-sans text-sm leading-relaxed mb-6">
            Small actions create a life of purpose. Your journey through Purpose Lab
            starts with a single story.
          </p>
          <button
            className="px-9 py-3.5 rounded-full font-sans font-medium text-white transition-all shadow-md hover:shadow-lg hover:opacity-90"
            style={{ backgroundColor: "#2F7F7B" }}
            data-testid="begin-journey-btn"
          >
            Begin with Stage One
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: "#081E28" }}
        data-testid="footer"
      >
        <img
          src={rippleLabsLogo}
          alt="Ripple Labs"
          className="h-7 w-auto object-contain brightness-0 invert opacity-60"
          data-testid="footer-logo"
        />
        <p className="text-[#5FA8A5] text-xs font-sans opacity-60 text-center">
          © {new Date().getFullYear()} Ripple Labs · Purpose Lab
        </p>
        <div className="flex gap-5">
          <Link href="/" className="text-[#5FA8A5] text-xs font-sans hover:text-[#D7ECEB] transition-colors">
            Home
          </Link>
          <a href="#" className="text-[#5FA8A5] text-xs font-sans hover:text-[#D7ECEB] transition-colors">
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
