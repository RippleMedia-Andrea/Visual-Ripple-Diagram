import { Link } from "wouter";
import rippleLabsLogo from "@assets/2876A1D3-1596-40F7-9384-F5AAA5F311E8_1777042604510.png";
import purposeLabLogo from "@assets/31DC4C16-212D-406B-AC0B-609119CF0477_1777042604510.png";
import { RippleMethodDiagram } from "@/components/RippleMethodDiagram";

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F5F1E8" }}
      data-testid="home-page"
    >
      {/* Nav */}
      <nav
        className="w-full px-6 md:px-12 py-5 flex items-center justify-between"
        style={{ backgroundColor: "#0F2A36" }}
        data-testid="nav"
      >
        <img
          src={rippleLabsLogo}
          alt="Ripple Labs"
          className="h-10 w-auto object-contain rounded-lg"
          data-testid="nav-logo"
        />
        <div className="flex items-center gap-6">
          <Link
            href="/ripple-method"
            className="text-[#D7ECEB] text-sm font-sans hover:text-[#C8A96A] transition-colors"
            data-testid="nav-method"
          >
            The Ripple Method™
          </Link>
          <Link
            href="/purpose-lab"
            className="text-[#D7ECEB] text-sm font-sans hover:text-[#C8A96A] transition-colors"
            data-testid="nav-purpose-lab"
          >
            Purpose Lab
          </Link>
          <Link
            href="/purpose-lab"
            className="px-4 py-2 rounded-full text-sm font-sans font-medium transition-all border border-[#2F7F7B] text-[#D7ECEB] hover:bg-[#2F7F7B] hover:text-white"
            data-testid="nav-cta"
          >
            Begin
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-28"
        style={{ backgroundColor: "#F5F1E8" }}
        data-testid="hero-section"
      >
        <div className="max-w-2xl mx-auto">
          <p className="text-[#C8A96A] text-xs font-sans font-medium uppercase tracking-widest mb-6" data-testid="hero-eyebrow">
            Welcome to Ripple Labs
          </p>
          <h1
            className="text-4xl md:text-6xl font-serif font-semibold text-[#0F2A36] leading-tight mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
            data-testid="hero-headline"
          >
            What's within you
            <br />
            <em>creates a ripple.</em>
          </h1>
          <div className="gold-divider w-24 mx-auto my-6" />
          <p
            className="text-[#2F7F7B] text-lg font-sans font-light leading-relaxed"
            data-testid="hero-subheadline"
          >
            A platform for purposeful growth — where self-discovery becomes
            outward impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
            <a
              href="#method"
              className="px-8 py-3 rounded-full font-sans font-medium text-white transition-all shadow-md hover:shadow-lg"
              style={{ backgroundColor: "#2F7F7B" }}
              data-testid="hero-primary-cta"
            >
              Explore the Method
            </a>
            <Link
              href="/purpose-lab"
              className="px-8 py-3 rounded-full font-sans font-medium border transition-all"
              style={{
                borderColor: "#C8A96A",
                color: "#0F2A36",
              }}
              data-testid="hero-secondary-cta"
            >
              Visit Purpose Lab
            </Link>
          </div>
        </div>
      </section>

      {/* Explore Cards */}
      <section
        className="px-6 md:px-12 py-16"
        style={{ backgroundColor: "#F5F1E8" }}
        data-testid="explore-section"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-3">
              Explore
            </p>
            <h2
              className="text-2xl md:text-3xl font-serif font-semibold text-[#0F2A36]"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="explore-heading"
            >
              Where would you like to begin?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="explore-cards">
            {/* Free: Ripple Method */}
            <Link href="/ripple-method" data-testid="card-ripple-method">
              <div
                className="group rounded-2xl px-7 py-8 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer h-full"
                style={{
                  backgroundColor: "#EEE9DB",
                  borderColor: "#D7ECEB",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: "#D7ECEB", color: "#2F7F7B" }}
                    data-testid="free-badge"
                  >
                    Free Overview
                  </span>
                  <span className="text-[#C8A96A] text-xs group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <h3
                  className="text-xl font-serif font-semibold text-[#0F2A36] mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  The Ripple Method™
                </h3>
                <div className="w-6 h-px mb-3" style={{ backgroundColor: "#C8A96A" }} />
                <p className="text-[#5FA8A5] font-sans text-sm leading-relaxed">
                  Explore the six-stage framework at your own pace. No account required. Free for everyone.
                </p>
              </div>
            </Link>

            {/* Paid: Purpose Lab */}
            <Link href="/purpose-lab" data-testid="card-purpose-lab">
              <div
                className="group rounded-2xl px-7 py-8 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer h-full"
                style={{
                  backgroundColor: "#0F2A36",
                  borderColor: "#2F7F7B",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: "#C8A96A", color: "#0F2A36" }}
                    data-testid="paid-badge"
                  >
                    Guided Experience · $47
                  </span>
                  <span className="text-[#C8A96A] text-xs group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <h3
                  className="text-xl font-serif font-semibold text-white mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Purpose Lab
                </h3>
                <div className="w-6 h-px mb-3" style={{ backgroundColor: "#C8A96A" }} />
                <p className="text-[#9fd0cd] font-sans text-sm leading-relaxed">
                  The full hands-on experience — storytelling, pattern recognition, purpose statement, season alignment, and action steps.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Ripple Method Diagram Section */}
      <section
        id="method"
        className="px-6 md:px-12 py-20"
        style={{ backgroundColor: "#EEE9DB" }}
        data-testid="method-section"
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-3">
              The Framework
            </p>
            <h2
              className="text-3xl md:text-4xl font-serif font-semibold text-[#0F2A36] mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="method-heading"
            >
              The Ripple Method
            </h2>
            <p className="text-[#5FA8A5] font-sans text-base leading-relaxed max-w-xl mx-auto">
              Six stages of transformation — from your innermost story to your
              outermost impact. Tap any ring to explore each stage.
            </p>
          </div>

          <RippleMethodDiagram />
        </div>
      </section>

      {/* Purpose Lab Section */}
      <section
        id="purpose-lab"
        className="px-6 md:px-12 py-20"
        style={{ backgroundColor: "#F5F1E8" }}
        data-testid="purpose-lab-section"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-shrink-0">
              <img
                src={purposeLabLogo}
                alt="Purpose Lab"
                className="w-52 h-52 object-contain"
                data-testid="purpose-lab-logo"
              />
            </div>
            <div className="text-center md:text-left">
              <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-3">
                First Active Lab
              </p>
              <h2
                className="text-3xl md:text-4xl font-serif font-semibold text-[#0F2A36] mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
                data-testid="purpose-lab-heading"
              >
                Purpose Lab
              </h2>
              <div className="gold-divider w-20 mb-4 md:mx-0 mx-auto" />
              <p
                className="font-script text-lg text-[#2F7F7B] mb-4"
              >
                Uncover who you are. Live your purpose. Love your life.
              </p>
              <p className="text-[#0F2A36] font-sans text-sm leading-relaxed opacity-75 mb-6">
                Purpose Lab is the first experience within Ripple Labs — a guided
                journey through the Ripple Method designed to help you discover
                your unique purpose and live it with intention.
              </p>
              <Link
                href="/purpose-lab"
                className="inline-block px-7 py-3 rounded-full font-sans font-medium text-white text-sm transition-all shadow-md hover:shadow-lg hover:opacity-90"
                style={{ backgroundColor: "#2F7F7B" }}
                data-testid="purpose-lab-cta"
              >
                Enter Purpose Lab
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Stages — card grid */}
      <section
        className="px-6 md:px-12 py-20"
        style={{ backgroundColor: "#D7ECEB" }}
        data-testid="stages-section"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-3">
              Your Journey
            </p>
            <h2
              className="text-3xl md:text-4xl font-serif font-semibold text-[#0F2A36]"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="stages-heading"
            >
              Six Stages of Growth
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="stages-grid">
            {[
              {
                number: "01",
                title: "Reveal",
                subtitle: "Your Story",
                color: "#0F2A36",
                text: "#ffffff",
                desc: "Uncover the narrative you've been living.",
              },
              {
                number: "02",
                title: "Identify",
                subtitle: "Your Patterns",
                color: "#1a4a55",
                text: "#ffffff",
                desc: "Notice the recurring themes shaping your path.",
              },
              {
                number: "03",
                title: "Pinpoint",
                subtitle: "Your Purpose",
                color: "#2F7F7B",
                text: "#ffffff",
                desc: "Find the intersection of gifts, passion, and impact.",
              },
              {
                number: "04",
                title: "Personalize",
                subtitle: "Your Season",
                color: "#5FA8A5",
                text: "#0F2A36",
                desc: "Align your purpose with where you are right now.",
              },
              {
                number: "05",
                title: "Live",
                subtitle: "Your Ripple",
                color: "#9fd0cd",
                text: "#0F2A36",
                desc: "Let your daily life become an expression of truth.",
              },
              {
                number: "06",
                title: "Expand",
                subtitle: "Your Growth",
                color: "#EEE9DB",
                text: "#0F2A36",
                desc: "Your ripple touches others and grows outward.",
              },
            ].map((stage) => (
              <div
                key={stage.number}
                className="rounded-2xl px-6 py-7 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                style={{ backgroundColor: stage.color }}
                data-testid={`stage-card-${stage.number}`}
              >
                <div
                  className="text-xs font-sans font-medium mb-3 opacity-50"
                  style={{ color: stage.text }}
                >
                  {stage.number}
                </div>
                <h3
                  className="text-xl font-serif font-semibold mb-1"
                  style={{
                    color: stage.text,
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {stage.title}
                </h3>
                <p
                  className="text-xs font-sans uppercase tracking-widest mb-3 opacity-60"
                  style={{ color: stage.text }}
                >
                  {stage.subtitle}
                </p>
                <div
                  className="w-8 h-px mb-3"
                  style={{ backgroundColor: "#C8A96A" }}
                />
                <p
                  className="text-sm font-sans leading-relaxed opacity-75"
                  style={{ color: stage.text }}
                >
                  {stage.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section
        className="px-6 py-20 text-center"
        style={{ backgroundColor: "#0F2A36" }}
        data-testid="footer-cta-section"
      >
        <div className="max-w-xl mx-auto">
          <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-4">
            Begin Here
          </p>
          <h2
            className="text-3xl md:text-4xl font-serif font-semibold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Your ripple starts within.
          </h2>
          <div className="gold-divider w-24 mx-auto my-6" />
          <p className="font-script text-lg text-[#D7ECEB] mb-8">
            What's within you creates a ripple.
          </p>
          <Link
            href="/purpose-lab"
            className="inline-block px-9 py-3.5 rounded-full font-sans font-medium text-white transition-all shadow-lg hover:opacity-90 hover:shadow-xl"
            style={{ backgroundColor: "#2F7F7B" }}
            data-testid="footer-cta"
          >
            Start Your Journey
          </Link>
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
          <Link href="/privacy" className="text-[#5FA8A5] text-xs font-sans hover:text-[#D7ECEB] transition-colors">Privacy</Link>
          <Link href="/terms" className="text-[#5FA8A5] text-xs font-sans hover:text-[#D7ECEB] transition-colors">Terms</Link>
          <Link href="/support" className="text-[#5FA8A5] text-xs font-sans hover:text-[#D7ECEB] transition-colors">Support</Link>
        </div>
      </footer>
    </div>
  );
}
