import { Link } from "wouter";
import rippleLabsLogo from "@assets/2876A1D3-1596-40F7-9384-F5AAA5F311E8_1777042604510.png";
import type { ReactNode } from "react";

export function PublicPageLayout({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#0B1F4B] flex flex-col">
      <nav className="w-full px-6 md:px-12 py-5 flex items-center justify-between bg-[#0B1F4B]">
        <Link href="/">
          <img src={rippleLabsLogo} alt="Ripple Labs" className="h-9 w-auto rounded-md" />
        </Link>
        <Link href="/purpose-lab" className="text-[#F5F1E8] text-sm font-sans hover:text-[#C9A84C] transition-colors">
          Purpose Lab
        </Link>
      </nav>
      <main className="w-full max-w-3xl mx-auto px-6 md:px-10 py-14 md:py-20 flex-1">
        {eyebrow && <p className="text-[#C9A84C] text-xs font-sans uppercase tracking-widest mb-4">{eyebrow}</p>}
        <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-10">{title}</h1>
        <article className="space-y-8 font-sans text-[#0B1F4B]/80 leading-relaxed text-sm md:text-base">
          {children}
        </article>
      </main>
      <footer data-testid="footer" className="px-6 py-8 bg-[#071433] border-t border-[#C9A84C]/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[#B9C3D9] text-xs font-sans text-center">© {new Date().getFullYear()} Ripple Labs</p>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2" data-testid="footer-nav">
          {[
            ["/", "Home", "home"],
            ["/ripple-method", "The Ripple Method", "ripple-method"],
            ["/purpose-lab", "Purpose Lab", "purpose-lab"],
            ["/privacy", "Privacy", "privacy"],
            ["/terms", "Terms", "terms"],
            ["/support", "Support", "support"],
          ].map(([href, label, id]) => (
            <Link key={id} href={href} className="text-[#EDE4CC] text-xs hover:text-[#C9A84C] transition-colors" data-testid={`link-footer-${id}`}>
              {label}
            </Link>
          ))}
          <a href="https://www.andreajohn.com" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] text-xs hover:text-[#F5F1E8] transition-colors" data-testid="link-footer-andrea-site">
            AndreaJohn.com
          </a>
        </div>
      </footer>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-serif font-semibold text-[#0B1F4B] mb-2">{title}</h2>
      {children}
    </section>
  );
}