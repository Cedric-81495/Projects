import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ButtonLink } from '@/components/ui/Button';

/**
 * Apparel is one stop on the journey, not the destination.
 * Kept intentionally quiet: it frames clothing as a symbol, not a storefront.
 */
export function ApparelBand() {
  return (
    <section id="apparel" className="border-y border-faint/30 bg-onyx">
      <Container className="py-20">
        <Reveal>
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Eyebrow>Wear your story</Eyebrow>
              <h2 className="mt-6 max-w-lg text-balance font-display text-display-md font-semibold text-bone">
                The apparel is a symbol you can fasten yourself.
              </h2>
              <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted">
                Every piece carries the mark of the movement. Not merch — a quiet declaration that
                you crossed the distance, or that you&rsquo;re walking it now.
              </p>
              <ButtonLink to="/apparel" variant="outline" withArrow className="mt-8">
                View the lookbook
              </ButtonLink>
            </div>

            {/* Lookbook stand-in triptych */}
            <div className="grid grid-cols-3 gap-3">
              {['A', 'B', 'C'].map((k, i) => (
                <div
                  key={k}
                  className="relative aspect-[3/4] overflow-hidden rounded-xl border border-faint/40 bg-ink"
                  style={{ marginTop: i === 1 ? '1.5rem' : 0 }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,rgb(var(--c-gold)/0.18),transparent_60%)]" />
                  <div className="absolute inset-0 bg-grain opacity-[0.06]" />
                  <span className="absolute bottom-3 left-3 h-6 w-6 rounded-full border border-gold/60" />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
