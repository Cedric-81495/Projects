import { FadeUp } from '../ui/FadeUp';

const STEPS = [
  { num: '01', title: 'Assess', body: 'Full credit pull across all three bureaus and a funding-readiness audit of your business file.' },
  { num: '02', title: 'Repair', body: 'Dispute inaccurate, unverifiable, and outdated items dragging your score down.' },
  { num: '03', title: 'Build', body: 'Establish trade lines and business credit that lenders actually recognize.' },
  { num: '04', title: 'Fund', body: 'Apply to a matched set of lenders with documentation prepared to their standard.' },
];

export function Process() {
  return (
    <section id="process" className="bg-ink2 px-8 py-24">
      <div className="text-center max-w-[640px] mx-auto mb-14">
        <span className="block font-mono text-xs uppercase tracking-wide text-brassBright mb-3.5">The Path</span>
        <h2 className="font-display text-[clamp(28px,3.6vw,40px)] text-offwhite mb-3.5">Four stages. One outcome.</h2>
        <p className="text-paper2">Every client moves through the same sequence, because funding approval follows the same order every time.</p>
      </div>
      <div className="relative grid grid-cols-2 md:grid-cols-4 max-w-[1180px] mx-auto gap-y-10">
        <div className="hidden md:block absolute top-[22px] left-[6%] right-[6%] h-px bg-line" />
        {STEPS.map((step) => (
          <FadeUp key={step.num} className="px-5 text-left relative">
            <div className="font-mono text-[13px] text-brass w-11 h-11 border border-brass rounded-full flex items-center justify-center bg-ink relative z-10 mb-5">
              {step.num}
            </div>
            <h3 className="text-lg text-offwhite font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-paper2">{step.body}</p>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
