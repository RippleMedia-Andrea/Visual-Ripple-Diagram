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
    <div className="min-h-screen bg-[#F5F1E8] text-[#0F2A36] flex flex-col">
      <nav className="w-full px-6 md:px-12 py-5 flex items-center justify-between bg-[#0F2A36]">
        <Link href="/">
          <img src={rippleLabsLogo} alt="Ripple Labs" className="h-9 w-auto rounded-md" />
        </Link>
        <Link href="/purpose-lab" className="text-[#D7ECEB] text-sm font-sans hover:text-[#C8A96A]">
          Purpose Lab
        </Link>
      </nav>
      <main className="w-full max-w-3xl mx-auto px-6 md:px-10 py-14 md:py-20 flex-1">
        {eyebrow && <p className="text-[#C8A96A] text-xs font-sans uppercase tracking-widest mb-4">{eyebrow}</p>}
        <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-10">{title}</h1>
        <article className="space-y-8 font-sans text-[#0F2A36]/80 leading-relaxed text-sm md:text-base">
          {children}
        </article>
      </main>
      <footer className="px-6 py-8 bg-[#081E28] flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[#5FA8A5] text-xs font-sans text-center">© {new Date().getFullYear()} Ripple Labs</p>
        <div className="flex gap-5">
          <Link href="/privacy" className="text-[#5FA8A5] text-xs hover:text-[#D7ECEB]">Privacy</Link>
          <Link href="/terms" className="text-[#5FA8A5] text-xs hover:text-[#D7ECEB]">Terms</Link>
          <Link href="/support" className="text-[#5FA8A5] text-xs hover:text-[#D7ECEB]">Support</Link>
        </div>
      </footer>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-serif font-semibold text-[#0F2A36] mb-2">{title}</h2>
      {children}
    </section>
  );
}