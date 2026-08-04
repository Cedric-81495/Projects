import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { founder } from '@/data/content';

export function FounderPage() {
  return (
    <>
      <PageHeader eyebrow="The Founder" title={founder.role + '.'} />
      <section className="section-y bg-green">
        <Container size="prose">
          <blockquote className="border-l-2 border-gold pl-6">
            <p className="text-balance font-display text-3xl font-medium leading-tight text-bone">
              &ldquo;{founder.quote}&rdquo;
            </p>
          </blockquote>
          <div className="mt-10 space-y-6 text-pretty text-lg leading-relaxed text-muted">
            <p>{founder.bio}</p>
            <p>
              What began as one refusal has become a platform: documentaries, a podcast, music, a
              community, and a symbol thousands now wear. The mission has never changed — make the
              distance from handcuffs to cufflinks walkable for anyone willing to start.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
