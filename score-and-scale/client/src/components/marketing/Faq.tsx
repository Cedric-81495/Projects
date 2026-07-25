const FAQS = [
  {
    q: 'How fast will my score change?',
    a: "Bureaus generally respond to disputes within 30–45 days. Most clients see their first meaningful movement within one to two billing cycles, though results depend on what's actually on your file.",
  },
  {
    q: 'Is funding guaranteed?',
    a: 'No program can guarantee lender approval. What we control is the readiness of your file — accurate reporting, established trade lines, and documentation lenders expect.',
  },
  {
    q: 'Can I do this without business credit history?',
    a: "Yes. The Foundation and Repair + Build programs both start with building a credit profile from scratch, including EIN-based trade lines that don't rely on your personal score.",
  },
  {
    q: "What's the difference between the three programs?",
    a: 'Foundation teaches you to do it yourself. Repair + Build has our team manage disputes and credit building directly. Mentorship adds 1:1 strategy and direct lender introductions on top of that.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="px-8 py-24">
      <div className="text-center max-w-[640px] mx-auto mb-14">
        <span className="block font-mono text-xs uppercase tracking-wide text-brassBright mb-3.5">Questions</span>
        <h2 className="font-display text-[clamp(28px,3.6vw,40px)] text-offwhite">Before you start</h2>
      </div>
      <div className="max-w-[780px] mx-auto">
        {FAQS.map((item) => (
          <div key={item.q} className="border-b border-line py-6">
            <h3 className="text-[17px] text-offwhite font-semibold mb-2">{item.q}</h3>
            <p className="text-sm text-paper2 max-w-[640px]">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
