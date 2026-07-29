export function Quote() {
  return (
    <section className="bg-paper text-ink text-center px-8 py-24">
      <blockquote className="font-display italic text-[clamp(22px,3vw,32px)] max-w-[820px] mx-auto mb-5 leading-snug">
        &ldquo;We stopped applying and getting denied. We started applying and getting approved —
        because the file was actually ready this time.&rdquo;
      </blockquote>
      <cite className="font-mono text-[13px] not-italic text-teal tracking-wide">— Program Graduate, Repair + Build</cite>
    </section>
  );
}
