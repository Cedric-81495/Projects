import { Link } from 'react-router-dom';
import { useReveal } from '@/lib/useReveal';
import { useAsync } from '@/lib/useAsync';
import { getLookbook } from '@/services/content';
import { Eyebrow, Reveal } from '@/shared/ui';
import { AsyncContent, EmptyState } from '@/shared/state';
import { Skeleton } from '@/shared/state';
import { Lookbook } from './Lookbook';

export function LookbookPage() {
  const { status, data, reload } = useAsync(getLookbook, []);
  useReveal(status);

  return (
    <>
      <section className="sec t-3" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Eyebrow>Brand expression · wear your story</Eyebrow>
          <Reveal as="h2" delay={1} className="h2">One journey,<br />eight looks.</Reveal>
          <Reveal delay={1} className="body" as="p">
            Apparel supports the mission — it does not lead it. Each look is a chapter of the
            same arc, from the heavyweight cotton of the earliest days to the tailoring at the
            end. This is a lookbook, not a store: wear the transformation.
          </Reveal>
        </div>
      </section>

      <section className="sec t-3" style={{ paddingTop: 'clamp(30px,4vw,50px)' }}>
        <div className="wrap">
          <AsyncContent
            status={status}
            data={data}
            onRetry={reload}
            loading={
              <div className="rail" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div className="chip" key={i}><Skeleton ratio="2x3" /></div>
                ))}
              </div>
            }
            empty={
              <EmptyState
                title="The collections are being shot"
                note="The chapters of the arc will appear here once the campaign imagery is ready."
                action={<Link className="btn btn--ghost btn--sm" to="/movement">Read the movement</Link>}
              />
            }
          >
            {(entries) => <Lookbook entries={entries} />}
          </AsyncContent>
        </div>
      </section>
    </>
  );
}
