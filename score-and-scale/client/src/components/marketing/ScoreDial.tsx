import { useEffect, useRef, useState } from 'react';

const TOTAL = 377;
const TARGET_FRAC = 0.78;

export function ScoreDial() {
  const arcRef = useRef<SVGPathElement>(null);
  const [score, setScore] = useState(580);
  const [caption, setCaption] = useState('Rebuilding');

  useEffect(() => {
    let raf = 0;
    const duration = 1600;
    const start = performance.now();

    function step(t: number) {
      const progress = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (arcRef.current) {
        arcRef.current.setAttribute('stroke-dashoffset', String(TOTAL - TOTAL * TARGET_FRAC * eased));
      }
      setScore(Math.round(580 + (780 - 580) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setCaption('Funding-Ready');
      }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="bg-gradient-to-b from-ink2 to-ink border border-line rounded-md p-9">
      <div className="relative w-full max-w-[320px] mx-auto">
        <svg viewBox="0 0 300 180" width="100%">
          <path
            d="M 30 160 A 120 120 0 0 1 270 160"
            fill="none"
            stroke="rgba(241,234,217,0.12)"
            strokeWidth={16}
            strokeLinecap="round"
          />
          <path
            ref={arcRef}
            d="M 30 160 A 120 120 0 0 1 270 160"
            fill="none"
            stroke="url(#dialGrad)"
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={TOTAL}
            strokeDashoffset={TOTAL}
          />
          <defs>
            <linearGradient id="dialGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B33F3F" />
              <stop offset="55%" stopColor="#C6A15B" />
              <stop offset="100%" stopColor="#1F6F5C" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[14%] text-center">
          <div className="font-mono text-[44px] font-semibold text-offwhite">{score}</div>
          <div className="text-xs text-teal uppercase tracking-wide mt-0.5">{caption}</div>
        </div>
      </div>
      <div className="flex justify-between font-mono text-[11px] text-paper2 mt-2.5 px-1.5">
        <span>POOR</span>
        <span>FAIR</span>
        <span>GOOD</span>
        <span>EXCELLENT</span>
      </div>
      <div className="flex justify-between mt-5 pt-4 border-t border-line text-xs text-paper2">
        <span>
          Avg. score lift
          <b className="block text-offwhite font-mono text-[15px] mt-0.5">+118 pts</b>
        </span>
        <span>
          Avg. time to funded
          <b className="block text-offwhite font-mono text-[15px] mt-0.5">97 days</b>
        </span>
      </div>
    </div>
  );
}
