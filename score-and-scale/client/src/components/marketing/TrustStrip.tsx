export function TrustStrip() {
  const items = [
    'Section 609 & FCRA-Based Disputes',
    'Business Credit Building',
    'Lender-Ready Documentation',
    'Funding Strategy Included',
  ];
  return (
    <div className="border-y border-line px-8 py-5">
      <div className="max-w-[1180px] mx-auto flex justify-between flex-wrap gap-5 font-mono text-xs uppercase tracking-wide text-paper2">
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}
