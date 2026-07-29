import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FadeUp } from '../ui/FadeUp';

interface Tier {
  slug: string;
  tag: string;
  name: string;
  sub: string;
  price: string;
  amount: string; // decimal string Braintree expects, e.g. "497.00"
  billing: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    slug: 'academy',
    tag: 'Foundation',
    name: 'Score & Scale Academy',
    sub: 'Self-paced course',
    price: '$497',
    amount: '497.00',
    billing: 'one-time',
    features: ['Credit repair fundamentals', 'Dispute letter templates', 'Business credit 101', 'Lender-readiness checklist'],
    cta: 'Enroll Now',
  },
  {
    slug: 'repair-build',
    tag: 'Guided',
    name: 'Repair + Build Program',
    sub: 'Done-with-you support',
    price: '$1,800',
    amount: '1800.00',
    billing: '/ program',
    features: [
      'Bureau & furnisher disputes managed for you',
      'Business credit line placement',
      'Monthly progress reviews',
      'Funding application prep',
    ],
    cta: 'Get Started',
    featured: true,
  },
  {
    slug: 'mentorship',
    tag: 'Elite',
    name: 'Private Funding Mentorship',
    sub: 'Hands-on, one-to-one',
    price: '$5,000',
    amount: '5000.00',
    billing: '/ engagement',
    features: ['Custom credit & funding roadmap', 'Direct lender matching', 'Weekly 1:1 strategy calls', 'Priority dispute handling'],
    cta: 'Book a Call',
  },
];

export function Tiers() {
  const navigate = useNavigate();
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  function handleEnroll(tier: Tier) {
    setLoadingSlug(tier.slug);
    // ProtectedRoute (wrapping /checkout in App.tsx) will bounce to /login
    // if there's no session yet, preserving this exact destination + query
    // string via location state, then send the user back here post-login.
    //
    // NOTE: this currently passes programSlug through rather than a real
    // enrollmentId, since Enrollment-doc creation isn't wired in yet.
    // checkout.routes.ts already treats enrollmentId as optional — once
    // enrollments.routes.ts's create-enrollment shape is confirmed, swap
    // this to create the Enrollment first (or resolve it server-side from
    // programSlug) and pass a real enrollmentId instead.
    navigate(`/checkout?programSlug=${tier.slug}&amount=${tier.amount}`);
  }

  return (
    <section id="programs" className="px-8 py-24">
      <div className="text-center max-w-[640px] mx-auto mb-14">
        <span className="block font-mono text-xs uppercase tracking-wide text-brassBright mb-3.5">Programs</span>
        <h2 className="font-display text-[clamp(28px,3.6vw,40px)] text-offwhite mb-3.5">Choose your level of support</h2>
        <p className="text-paper2">Start self-paced, or bring in direct guidance for the parts that matter most.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1180px] mx-auto">
        {TIERS.map((tier) => (
          <FadeUp key={tier.slug}>
            <div
              className={`relative flex flex-col h-full border rounded-md p-9 transition-transform hover:-translate-y-1.5 ${
                tier.featured
                  ? 'border-brass bg-gradient-to-b from-brass/10 to-ink2'
                  : 'border-line bg-ink2 hover:border-brass'
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brass text-ink font-mono text-[11px] uppercase tracking-wide px-3.5 py-1 rounded-full font-semibold">
                  Most Chosen
                </span>
              )}
              <span className="font-mono text-[11px] uppercase tracking-wide text-teal mb-3.5">{tier.tag}</span>
              <h3 className="text-2xl text-offwhite mb-1.5">{tier.name}</h3>
              <p className="text-[13px] text-paper2 mb-6">{tier.sub}</p>
              <div className="font-mono text-[34px] text-brassBright mb-6">
                {tier.price}
                <span className="text-sm text-paper2 font-sans"> {tier.billing}</span>
              </div>
              <ul className="mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="text-sm text-paper2 py-2.5 border-b border-brass/10 flex gap-2.5">
                    <span className="text-teal font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleEnroll(tier)}
                disabled={loadingSlug === tier.slug}
                className={`text-center py-3.5 rounded-sm text-sm font-semibold tracking-wide transition-colors disabled:opacity-60 ${
                  tier.featured
                    ? 'bg-brass text-ink hover:bg-brassBright'
                    : 'border border-paper2 text-paper hover:border-brassBright hover:text-brassBright'
                }`}
              >
                {loadingSlug === tier.slug ? 'Loading…' : tier.cta}
              </button>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
