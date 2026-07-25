import { Link } from 'react-router-dom';
import { SectionLink } from '../ui/SectionLink';

export function Footer() {
  return (
    <footer className="bg-ink2 border-t border-line px-8 pt-14 pb-8">
      <div className="max-w-[1180px] mx-auto flex justify-between flex-wrap gap-10 mb-9">
        <div className="max-w-[280px]">
          <div className="flex items-center gap-2.5 font-display text-xl font-bold text-offwhite">
            <span className="w-[30px] h-[30px] border border-brass rounded-full flex items-center justify-center font-mono text-xs text-brass">
              S&amp;S
            </span>
            Score &amp; Scale
          </div>
          <p className="text-paper2 text-sm mt-3">
            Credit repair and business funding education, guidance, and mentorship.
          </p>
        </div>
        <div>
          <h4 className="font-mono text-xs uppercase tracking-wide text-brassBright mb-3.5">Programs</h4>
          <SectionLink to="#programs" className="block text-sm text-paper2 mb-2.5 hover:text-brassBright">Academy</SectionLink>
          <SectionLink to="#programs" className="block text-sm text-paper2 mb-2.5 hover:text-brassBright">Repair + Build</SectionLink>
          <SectionLink to="#programs" className="block text-sm text-paper2 mb-2.5 hover:text-brassBright">Mentorship</SectionLink>
        </div>
        <div>
          <h4 className="font-mono text-xs uppercase tracking-wide text-brassBright mb-3.5">Company</h4>
          <SectionLink to="#process" className="block text-sm text-paper2 mb-2.5 hover:text-brassBright">Our Process</SectionLink>
          <SectionLink to="#faq" className="block text-sm text-paper2 mb-2.5 hover:text-brassBright">FAQ</SectionLink>
          {/* Full-page contact form, per spec — not a footer modal/snippet */}
          <Link to="/contact" className="block text-sm text-paper2 mb-2.5 hover:text-brassBright">Contact</Link>
        </div>
      </div>
      <div className="max-w-[1180px] mx-auto border-t border-line pt-6 text-xs text-paper/50 leading-relaxed">
        Score &amp; Scale is an educational and consulting service. We do not guarantee removal of
        any specific item from a credit report, a specific credit score increase, or approval for
        any loan or line of credit. Results vary by individual circumstances. This is not legal or
        financial advice. Under the Credit Repair Organizations Act, you have the right to cancel
        your contract without penalty within three business days of signing.
      </div>
    </footer>
  );
}
