import { ScoreDial } from './ScoreDial';

export function Hero() {
  return (
    <section className="relative px-8 pt-24 pb-20 overflow-hidden">
      <div className="max-w-[1180px] mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-brassBright border border-line rounded-full px-3.5 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal shadow-[0_0_8px_theme(colors.teal)]" />
            Credit Repair &amp; Business Funding
          </span>
          <h1 className="font-display text-[clamp(38px,5vw,60px)] leading-[1.04] text-offwhite mb-5">
            Fix the score.
            <br />
            Then <em className="italic text-brassBright">fund the vision.</em>
          </h1>
          <p className="text-lg text-paper2 max-w-[480px] mb-8">
            Most funding gets denied for the same three reasons. We rebuild your credit profile
            first, then walk you through the capital your business actually qualifies for.
          </p>
          <div className="flex gap-4 flex-wrap">
            <a href="#programs" className="px-7 py-3.5 rounded-sm text-sm font-semibold tracking-wide bg-brass text-ink hover:bg-brassBright transition-colors">
              See Programs
            </a>
            <a href="#process" className="px-7 py-3.5 rounded-sm text-sm font-semibold tracking-wide border border-paper2 text-paper hover:border-brassBright hover:text-brassBright transition-colors">
              How It Works
            </a>
          </div>
        </div>
        <ScoreDial />
      </div>
    </section>
  );
}
