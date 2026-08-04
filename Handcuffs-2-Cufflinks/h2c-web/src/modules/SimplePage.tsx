import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Container';

/** Lightweight page used for legal/utility routes. */
export function SimplePage({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} intro="This page is in progress." />
      <section className="section-y bg-ink">
        <Container size="prose">
          <p className="text-muted">Content coming soon.</p>
        </Container>
      </section>
    </>
  );
}
