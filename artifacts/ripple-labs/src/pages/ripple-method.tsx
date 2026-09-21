import { Link } from "wouter";
import rippleLabsLogo from "@assets/2876A1D3-1596-40F7-9384-F5AAA5F311E8_1777042604510.png";
import { RippleMethodDiagram } from "@/components/RippleMethodDiagram";

const stages = [
  {
    number: "01",
    id: "reveal",
    title: "Reveal",
    subtitle: "Your Story",
    teaching:
      "Your story holds clues. In this stage, you begin noticing the experiences, moments, and memories that shaped you and revealed pieces of who you already are.",
    color: "#0F2A36",
    textColor: "#ffffff",
    borderColor: "rgba(215,236,235,0.12)",
  },
  {
    number: "02",
    id: "identify",
    title: "Identify",
    subtitle: "Your Patterns",
    teaching:
      "Patterns reveal purpose. This stage helps you notice recurring themes, emotions, strengths, values, and ways you naturally impact others.",
    color: "#1a4a55",
    textColor: "#ffffff",
    borderColor: "rgba(215,236,235,0.12)",
  },
  {
    number: "03",
    id: "pinpoint",
    title: "Pinpoint",
    subtitle: "Your Purpose",
    teaching:
      "Purpose becomes clearer when you put language to it. This stage helps you move from patterns to a purpose statement rooted in action and impact.",
    color: "#2F7F7B",
    textColor: "#ffffff",
    borderColor: "rgba(245,241,232,0.15)",
  },
  {
    number: "04",
    id: "personalize",
    title: "Personalize",
    subtitle: "Your Season",
    teaching:
      "Your purpose is not limited by your season. It is expressed through it. This stage helps you understand what living your purpose can look like in your current roles, responsibilities, and life stage.",
    color: "#5FA8A5",
    textColor: "#0F2A36",
    borderColor: "rgba(15,42,54,0.08)",
  },
  {
    number: "05",
    id: "live",
    title: "Live",
    subtitle: "Your Ripple",
    teaching:
      "Clarity becomes powerful when it turns into action. This stage helps you identify what to start, stop, and continue so you can live with greater alignment.",
    color: "#9fd0cd",
    textColor: "#0F2A36",
    borderColor: "rgba(15,42,54,0.08)",
  },
  {
    number: "06",
    id: "expand",
    title: "Expand",
    subtitle: "Your Growth",
    teaching:
      "Purpose is not a one-time discovery. It is something you continue to live, revisit, and grow into over time as your life changes.",
    color: "#EEE9DB",
    textColor: "#0F2A36",
    borderColor: "rgba(15,42,54,0.08)",
  },
];

export default function RippleMethod() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F5F1E8" }}
      data-testid="ripple-method-page"
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
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="text-[#D7ECEB] text-xs font-sans hover:text-[#C8A96A] transition-colors"
            data-testid="nav-home"
          >
            ← Home
          </Link>
          <Link
            href="/purpose-lab"
            className="text-[#D7ECEB] text-xs font-sans hover:text-[#C8A96A] transition-colors hidden sm:inline"
            data-testid="nav-purpose-lab"
          >
            Purpose Lab
          </Link>
          <Link
            href="/purpose-lab"
            className="px-4 py-2 rounded-full text-xs font-sans font-medium transition-all border border-[#2F7F7B] text-[#D7ECEB] hover:bg-[#2F7F7B] hover:text-white"
            data-testid="nav-enter-purpose-lab"
          >
            Enter Purpose Lab
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="px-6 md:px-12 py-20 text-center"
        style={{ backgroundColor: "#0F2A36" }}
        data-testid="hero-section"
      >
        <div className="max-w-2xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-sans font-medium uppercase tracking-widest mb-6 border"
            style={{ borderColor: "#C8A96A", color: "#C8A96A", backgroundColor: "rgba(200,169,106,0.08)" }}
            data-testid="free-badge"
          >
            Free Overview
          </div>
          <h1
            className="text-3xl md:text-5xl font-serif font-semibold text-white mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
            data-testid="hero-heading"
          >
            The Ripple Method™
          </h1>
          <div className="gold-divider w-24 mx-auto my-6" />
          <p className="text-[#9fd0cd] font-sans text-base leading-relaxed mb-6 max-w-xl mx-auto" data-testid="hero-intro">
            The Ripple Method™ is a guided framework designed to help you uncover what is already within you and learn how to live it with clarity and intention. It is built on the belief that purpose is not something you create from scratch. It is something you recognize, name, and live.
          </p>
          <p className="font-script text-xl text-[#D7ECEB]" data-testid="hero-anchor">
            What's within you creates a ripple.
          </p>
        </div>
      </section>

      {/* Flow indicator */}
      <section
        className="px-6 md:px-12 py-10 overflow-x-auto"
        style={{ backgroundColor: "#EEE9DB" }}
        data-testid="flow-indicator-section"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-0 min-w-max mx-auto">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="flex items-center">
                <div className="flex flex-col items-center text-center px-3" data-testid={`flow-step-${stage.id}`}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-sans font-semibold mb-2 shadow-sm"
                    style={{ backgroundColor: stage.color, color: stage.textColor }}
                  >
                    {stage.number}
                  </div>
                  <p
                    className="text-xs font-serif font-semibold text-[#0F2A36] leading-tight"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {stage.title}
                  </p>
                  <p className="text-[9px] font-sans uppercase tracking-wider text-[#5FA8A5] mt-0.5">
                    {stage.subtitle}
                  </p>
                </div>
                {idx < stages.length - 1 && (
                  <div className="flex items-center mx-1">
                    <div className="w-6 h-px" style={{ backgroundColor: "#C8A96A", opacity: 0.5 }} />
                    <span className="text-[#C8A96A] text-xs opacity-50">›</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Six Stages — vertical cards */}
      <section
        className="px-6 md:px-12 py-16"
        style={{ backgroundColor: "#F5F1E8" }}
        data-testid="stages-section"
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-3">
              The Six Stages
            </p>
            <h2
              className="text-3xl font-serif font-semibold text-[#0F2A36]"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="stages-heading"
            >
              From Story to Impact
            </h2>
          </div>

          <div className="space-y-4" data-testid="stages-list">
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                data-testid={`stage-card-${stage.id}`}
              >
                <div
                  className="flex items-stretch"
                  style={{ backgroundColor: stage.color }}
                >
                  {/* Number sidebar */}
                  <div
                    className="flex items-center justify-center px-5 py-6 flex-shrink-0"
                    style={{ borderRight: `1px solid ${stage.borderColor}` }}
                  >
                    <div className="text-center">
                      <p
                        className="text-xs font-sans font-semibold opacity-50 mb-1"
                        style={{ color: stage.textColor }}
                      >
                        {stage.number}
                      </p>
                      <div className="w-4 h-px" style={{ backgroundColor: "#C8A96A" }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-6 flex-1">
                    <div className="flex items-baseline gap-2 mb-2">
                      <h3
                        className="text-xl font-serif font-semibold"
                        style={{
                          color: stage.textColor,
                          fontFamily: "'Playfair Display', serif",
                        }}
                      >
                        {stage.title}
                      </h3>
                      <span
                        className="text-xs font-sans uppercase tracking-widest opacity-50"
                        style={{ color: stage.textColor }}
                      >
                        {stage.subtitle}
                      </span>
                    </div>
                    <p
                      className="text-sm font-sans leading-relaxed"
                      style={{ color: stage.textColor, opacity: 0.78 }}
                    >
                      {stage.teaching}
                    </p>
                  </div>

                  {/* Stage number large — decorative */}
                  <div
                    className="hidden md:flex items-center justify-center pr-6 flex-shrink-0"
                    style={{ color: stage.textColor, opacity: 0.06 }}
                  >
                    <span className="text-6xl font-serif font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {idx + 1}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual diagram section */}
      <section
        className="px-6 md:px-12 py-16"
        style={{ backgroundColor: "#EEE9DB" }}
        data-testid="diagram-section"
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-3">
            The Full Picture
          </p>
          <h2
            className="text-2xl font-serif font-semibold text-[#0F2A36] mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
            data-testid="diagram-heading"
          >
            All Six Stages Together
          </h2>
          <p className="text-[#5FA8A5] font-sans text-sm mb-10">
            Tap any ring to explore what happens at each stage.
          </p>
          <RippleMethodDiagram size={560} />
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="px-6 md:px-12 py-20"
        style={{ backgroundColor: "#0F2A36" }}
        data-testid="cta-section"
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-4" data-testid="cta-eyebrow">
            Ready to Go Deeper?
          </p>
          <h2
            className="text-3xl md:text-4xl font-serif font-semibold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
            data-testid="cta-heading"
          >
            Ready to go deeper?
          </h2>
          <div className="gold-divider w-24 mx-auto my-6" />
          <p className="text-[#9fd0cd] font-sans text-sm leading-relaxed mb-10 max-w-lg mx-auto" data-testid="cta-body">
            If you would like a more hands-on experience uncovering your purpose using The Ripple Method™, you can enter Purpose Lab or book a personal consultation.
          </p>

          {/* CTA Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10" data-testid="cta-cards">
            {/* Purpose Lab */}
            <div
              className="rounded-2xl px-7 py-8 text-left border"
              style={{
                backgroundColor: "rgba(47,127,123,0.15)",
                borderColor: "rgba(47,127,123,0.3)",
              }}
              data-testid="cta-card-purpose-lab"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[#C8A96A] text-[10px] font-sans uppercase tracking-widest">
                  Guided Experience
                </p>
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold"
                  style={{ backgroundColor: "#C8A96A", color: "#0F2A36" }}
                  data-testid="price-badge"
                >
                  $47
                </span>
              </div>
              <h3
                className="text-xl font-serif font-semibold text-white mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Purpose Lab
              </h3>
              <div className="w-6 h-px mb-3" style={{ backgroundColor: "#C8A96A" }} />
              <p className="text-[#9fd0cd] text-sm font-sans leading-relaxed mb-5">
                Purpose Lab walks you through the full guided experience with storytelling, reflection, pattern recognition, purpose statement creation, season alignment, and practical action steps.
              </p>
              <Link
                href="/purpose-lab"
                className="block text-center px-6 py-3 rounded-full font-sans font-medium text-white text-sm transition-all shadow-md hover:opacity-90"
                style={{ backgroundColor: "#2F7F7B" }}
                data-testid="cta-purchase-purpose-lab"
              >
                Purchase Purpose Lab — $47
              </Link>
            </div>

            {/* Consultation */}
            <div
              className="rounded-2xl px-7 py-8 text-left border"
              style={{
                backgroundColor: "rgba(200,169,106,0.08)",
                borderColor: "rgba(200,169,106,0.2)",
              }}
              data-testid="cta-card-consultation"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[#C8A96A] text-[10px] font-sans uppercase tracking-widest">
                  Personal Support
                </p>
              </div>
              <h3
                className="text-xl font-serif font-semibold text-white mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Book a Consultation
              </h3>
              <div className="w-6 h-px mb-3" style={{ backgroundColor: "#C8A96A" }} />
              <p className="text-[#9fd0cd] text-sm font-sans leading-relaxed mb-5">
                Consultations are available for those who want personal support understanding and applying their results.
              </p>
              <a
                href="#"
                className="block text-center px-6 py-3 rounded-full font-sans font-medium text-[#0F2A36] text-sm transition-all border hover:opacity-90"
                style={{ backgroundColor: "#C8A96A", borderColor: "#C8A96A" }}
                data-testid="cta-book-consultation"
              >
                Book a Consultation
              </a>
            </div>
          </div>

          <p className="text-[#5FA8A5] text-xs font-sans opacity-60">
            The Ripple Method™ overview is always free and available to everyone.
          </p>
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
          className="h-7 w-auto object-contain rounded-md opacity-80"
          data-testid="footer-logo"
        />
        <p className="text-[#5FA8A5] text-xs font-sans opacity-60 text-center">
          © {new Date().getFullYear()} Ripple Labs. What's within you creates a ripple.
        </p>
        <div className="flex gap-5">
          <Link href="/" className="text-[#5FA8A5] text-xs font-sans hover:text-[#D7ECEB] transition-colors">Home</Link>
          <Link href="/purpose-lab" className="text-[#5FA8A5] text-xs font-sans hover:text-[#D7ECEB] transition-colors">Purpose Lab</Link>
          <Link href="/privacy" className="text-[#5FA8A5] text-xs font-sans hover:text-[#D7ECEB] transition-colors">Privacy</Link>
          <Link href="/terms" className="text-[#5FA8A5] text-xs font-sans hover:text-[#D7ECEB] transition-colors">Terms</Link>
          <Link href="/support" className="text-[#5FA8A5] text-xs font-sans hover:text-[#D7ECEB] transition-colors">Support</Link>
        </div>
      </footer>
    </div>
  );
}
