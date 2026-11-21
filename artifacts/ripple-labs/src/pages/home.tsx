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
        className="w-full px-6 md:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: "#0B1F4B" }}
        data-testid="nav"
      >
        <img
          src={rippleLabsLogo}
          alt="Ripple Labs"
          className="h-10 w-auto object-contain rounded-lg shrink-0"
          data-testid="nav-logo"
        />
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 sm:gap-6">
          <Link
            href="/ripple-method"
            className="text-[#F5F1E8] text-sm font-sans hover:text-[#C9A84C] transition-colors focus-gold"
            data-testid="nav-method"
          >
            The Ripple Method™
          </Link>
          <Link
            href="/purpose-lab"
            className="text-[#F5F1E8] text-sm font-sans hover:text-[#C9A84C] transition-colors focus-gold"
            data-testid="nav-purpose-lab"
          >
            Purpose Lab
          </Link>
          <Link
            href="/purpose-lab"
            className="px-4 py-2 rounded-full text-sm font-sans font-medium transition-all border border-[#C9A84C] text-[#F5F1E8] hover:bg-[#C9A84C] hover:text-[#0B1F4B] focus-gold"
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
          <p className="text-[#C9A84C] text-xs font-sans font-medium tracking-widest mb-6" data-testid="hero-eyebrow">
            Hi, I'm Andrea. Welcome in.
          </p>
          <h1
            className="text-4xl md:text-6xl font-serif font-semibold text-[#0B1F4B] leading-tight mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
            data-testid="hero-headline"
          >
            What's within you
            <br />
            <em>creates a ripple.</em>
          </h1>
          <div className="gold-divider w-24 mx-auto my-6" />
          <p
            className="text-[#1E3A6E] text-lg font-sans font-light leading-relaxed"
            data-testid="hero-subheadline"
          >
            A place for purposeful growth, where self-discovery becomes
            outward impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
            <a
              href="#method"
              className="px-8 py-3 rounded-full font-sans font-medium text-[#F5F1E8] transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-gold"
              style={{ backgroundColor: "#0B1F4B" }}
              data-testid="hero-primary-cta"
            >
              Explore the Method
            </a>
            <Link
              href="/purpose-lab"
              className="px-8 py-3 rounded-full font-sans font-medium border transition-all duration-300 hover:bg-[#C9A84C] hover:-translate-y-0.5 focus-gold"
              style={{
                borderColor: "#C9A84C",
                color: "#0B1F4B",
              }}
              data-testid="hero-secondary-cta"
            >
              Visit Purpose Lab
            </Link>
          </div>
        </div>
      </section>

      {/* Guide */}
      <section className="px-6 md:px-12 pb-8" style={{ backgroundColor: "#F5F1E8" }} data-testid="guide-section">
        <div
          className="max-w-4xl mx-auto rounded-3xl overflow-hidden flex flex-col md:flex-row items-stretch shadow-lg"
          style={{ backgroundColor: "#0B1F4B", border: "1px solid rgba(201,168,76,0.45)" }}
          data-testid="card-guide-andrea"
        >
          <div className="md:w-2/5 relative min-h-[300px]" style={{ backgroundColor: "#16306A" }}>
            <img
              src={`${import.meta.env.BASE_URL}andrea-john.webp`}
              alt="Portrait of Andrea John"
              className="absolute inset-0 w-full h-full object-cover object-top"
              data-testid="img-andrea-portrait"
            />
            <div className="absolute inset-3 rounded-2xl pointer-events-none" style={{ border: "1px solid rgba(201,168,76,0.55)" }} />
          </div>
          <div className="md:w-3/5 px-8 py-10 md:px-12 md:py-12 flex flex-col justify-center">
            <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-3" data-testid="text-guide-eyebrow">
              Guided by Andrea John
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#F5F1E8] mb-2" style={{ fontFamily: "'Playfair Display', serif" }} data-testid="text-guide-name">
              Andrea John
            </h2>
            <p className="text-[#EDE4CC] text-xs font-sans uppercase tracking-[0.2em] mb-5" data-testid="text-guide-role">
              Author and Purpose Guide
            </p>
            <div className="w-10 h-px mb-5" style={{ backgroundColor: "#C9A84C" }} />
            <p className="text-[#F5F1E8]/85 font-sans text-sm md:text-base leading-relaxed mb-7">
              Andrea created Ripple Labs as a personal, welcoming place to walk alongside you as you discover who you are
              and the purpose you carry outward. Every stage here reflects the way she guides: gently, honestly, and one step at a time.
            </p>
            <a
              href="https://www.andreajohn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-sans font-medium text-[#0B1F4B] transition-all duration-300 hover:bg-[#F5F1E8] hover:-translate-y-0.5 focus-gold"
              style={{ backgroundColor: "#C9A84C" }}
              data-testid="link-guide-andrea-site"
            >
              Visit andreajohn.com
            </a>
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
            <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-3">
              Explore
            </p>
            <h2
              className="text-2xl md:text-3xl font-serif font-semibold text-[#0B1F4B]"
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
                  borderColor: "rgba(201,168,76,0.45)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: "#0B1F4B", color: "#F5F1E8" }}
                    data-testid="free-badge"
                  >
                    Free Overview
                  </span>
                  <span className="text-[#C9A84C] text-xs group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <h3
                  className="text-xl font-serif font-semibold text-[#0B1F4B] mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  The Ripple Method™
                </h3>
                <div className="w-6 h-px mb-3" style={{ backgroundColor: "#C9A84C" }} />
                <p className="text-[#5A6B8C] font-sans text-sm leading-relaxed">
                  Explore the six-stage framework at your own pace. No account required. Free for everyone.
                </p>
              </div>
            </Link>

            {/* Paid: Purpose Lab */}
            <Link href="/purpose-lab" data-testid="card-purpose-lab">
              <div
                className="group rounded-2xl px-7 py-8 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer h-full"
                style={{
                  backgroundColor: "#0B1F4B",
                  borderColor: "#C9A84C",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: "#C9A84C", color: "#0B1F4B" }}
                    data-testid="paid-badge"
                  >
                    Guided Experience · $47
                  </span>
                  <span className="text-[#C9A84C] text-xs group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <h3
                  className="text-xl font-serif font-semibold text-white mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Purpose Lab
                </h3>
                <div className="w-6 h-px mb-3" style={{ backgroundColor: "#C9A84C" }} />
                <p className="text-[#B9C3D9] font-sans text-sm leading-relaxed">
                  The full hands-on experience: your stories, your patterns, your purpose statement, your vision, and living your purpose in this season.
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
            <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-3">
              The Framework
            </p>
            <h2
              className="text-3xl md:text-4xl font-serif font-semibold text-[#0B1F4B] mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="method-heading"
            >
              The Ripple Method
            </h2>
            <p className="text-[#5A6B8C] font-sans text-base leading-relaxed max-w-xl mx-auto">
              Six stages of transformation, from your innermost story to your
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
              <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-3">
                First Active Lab
              </p>
              <h2
                className="text-3xl md:text-4xl font-serif font-semibold text-[#0B1F4B] mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
                data-testid="purpose-lab-heading"
              >
                Purpose Lab
              </h2>
              <div className="gold-divider w-20 mb-4 md:mx-0 mx-auto" />
              <p
                className="font-script text-lg text-[#1E3A6E] mb-4"
              >
                Uncover who you are. Live your purpose. Love your life.
              </p>
              <p className="text-[#0B1F4B] font-sans text-sm leading-relaxed opacity-75 mb-6">
                Purpose Lab is the first experience within Ripple Labs, a guided
                journey through the Ripple Method designed to help you discover
                your unique purpose and live it with intention.
              </p>
              <Link
                href="/purpose-lab"
                className="inline-block px-7 py-3 rounded-full font-sans font-medium text-[#F5F1E8] text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-gold"
                style={{ backgroundColor: "#0B1F4B" }}
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
        style={{ backgroundColor: "#EDE4CC" }}
        data-testid="stages-section"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-3">
              Your Journey
            </p>
            <h2
              className="text-3xl md:text-4xl font-serif font-semibold text-[#0B1F4B]"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="stages-heading"
            >
              Six Stages of Growth
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="stages-grid">
            {[
              { number: "01", title: "Reveal", subtitle: "Your Story", desc: "Uncover the narrative you've been living." },
              { number: "02", title: "Identify", subtitle: "Your Patterns", desc: "Notice the recurring themes shaping your path." },
              { number: "03", title: "Pinpoint", subtitle: "Your Purpose", desc: "Put who you are into words. Your purpose statement names your action and the impact it has on others." },
              { number: "04", title: "Picture", subtitle: "Your Vision", desc: "See the life your purpose makes possible, and notice whose picture of success you've been borrowing." },
              { number: "05", title: "Live", subtitle: "Your Season", desc: "Your season is not the waiting room to your life. Live your purpose right where you are." },
              { number: "06", title: "Expand", subtitle: "Your Ripple", desc: "Your ripple reaches the people around you and keeps growing." },
            ].map((stage, i) => {
              const dark = i % 2 === 0;
              return (
                <div
                  key={stage.number}
                  className="group relative overflow-hidden rounded-2xl px-6 py-7 border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: dark ? "#0B1F4B" : "#F5F1E8",
                    borderColor: dark ? "rgba(201,168,76,0.4)" : "rgba(11,31,75,0.14)",
                  }}
                  data-testid={`stage-card-${stage.number}`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 -top-4 text-7xl font-serif font-semibold opacity-15 transition-transform duration-500 group-hover:-translate-x-1"
                    style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}
                  >
                    {stage.number}
                  </span>
                  <div className="text-xs font-sans font-semibold tracking-widest mb-3" style={{ color: "#C9A84C" }}>
                    STAGE {stage.number}
                  </div>
                  <h3
                    className="text-xl font-serif font-semibold mb-1"
                    style={{ color: dark ? "#F5F1E8" : "#0B1F4B", fontFamily: "'Playfair Display', serif" }}
                    data-testid={`text-stage-title-${stage.number}`}
                  >
                    {stage.title}
                  </h3>
                  <p
                    className="text-xs font-sans uppercase tracking-widest mb-3"
                    style={{ color: dark ? "#EDE4CC" : "#1E3A6E" }}
                    data-testid={`text-stage-subtitle-${stage.number}`}
                  >
                    {stage.subtitle}
                  </p>
                  <div className="w-8 h-px mb-3 transition-all duration-300 group-hover:w-14" style={{ backgroundColor: "#C9A84C" }} />
                  <p className="text-sm font-sans leading-relaxed" style={{ color: dark ? "rgba(245,241,232,0.82)" : "rgba(11,31,75,0.78)" }}>
                    {stage.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section
        className="px-6 py-20 text-center"
        style={{ backgroundColor: "#0B1F4B" }}
        data-testid="footer-cta-section"
      >
        <div className="max-w-xl mx-auto">
          <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-4">
            Begin Here
          </p>
          <h2
            className="text-3xl md:text-4xl font-serif font-semibold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Your ripple starts within.
          </h2>
          <div className="gold-divider w-24 mx-auto my-6" />
          <p className="font-script text-lg text-[#EDE4CC] mb-8">
            What's within you creates a ripple.
          </p>
          <Link
            href="/purpose-lab"
            className="inline-block px-9 py-3.5 rounded-full font-sans font-medium text-[#0B1F4B] transition-all duration-300 shadow-lg hover:bg-[#F5F1E8] hover:-translate-y-0.5 focus-gold"
            style={{ backgroundColor: "#C9A84C" }}
            data-testid="footer-cta"
          >
            Start Your Journey
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 md:px-12 py-10"
        style={{ backgroundColor: "#071433", borderTop: "1px solid rgba(201,168,76,0.3)" }}
        data-testid="footer"
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <img
              src={rippleLabsLogo}
              alt="Ripple Labs"
              className="h-8 w-auto object-contain rounded-md"
              data-testid="footer-logo"
            />
            <p className="font-script text-base text-[#EDE4CC]">What's within you creates a ripple.</p>
          </div>
          <nav className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-3" data-testid="footer-nav">
            {[
              { href: "/", label: "Home", id: "home" },
              { href: "/ripple-method", label: "The Ripple Method", id: "ripple-method" },
              { href: "/purpose-lab", label: "Purpose Lab", id: "purpose-lab" },
              { href: "/privacy", label: "Privacy", id: "privacy" },
              { href: "/terms", label: "Terms", id: "terms" },
              { href: "/support", label: "Support", id: "support" },
            ].map((l) => (
              <Link
                key={l.id}
                href={l.href}
                className="text-[#EDE4CC] text-xs font-sans hover:text-[#C9A84C] transition-colors focus-gold"
                data-testid={`link-footer-${l.id}`}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://www.andreajohn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C9A84C] text-xs font-sans hover:text-[#F5F1E8] transition-colors focus-gold"
              data-testid="link-footer-andrea-site"
            >
              AndreaJohn.com
            </a>
          </nav>
        </div>
        <p className="max-w-5xl mx-auto mt-8 text-center md:text-left text-[#B9C3D9] text-xs font-sans" data-testid="text-footer-copyright">
          &copy; {new Date().getFullYear()} Ripple Labs. Guided by Andrea John.
        </p>
      </footer>
    </div>
  );
}
