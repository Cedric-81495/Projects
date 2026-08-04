import { isRouteErrorResponse, useRouteError, Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

/**
 * Route-level error boundary. Any render/loader error in the tree lands here
 * with the brand shell intact, instead of React Router's unstyled default.
 */
export function RouteError() {
  const error = useRouteError();

  let title = 'Something broke on our end.';
  let detail = 'An unexpected error stopped this page from loading. The movement continues — try again.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} — ${error.statusText}`;
    detail = error.data?.message ?? detail;
  } else if (error instanceof Error && import.meta.env.DEV) {
    detail = error.message;
  }

  return (
    <main className="grid min-h-[70vh] place-items-center bg-ink">
      <Container size="prose" className="text-center">
        <Eyebrow className="justify-center">Error</Eyebrow>
        <h1 className="mt-6 font-display text-display-md font-semibold text-bone">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-pretty text-muted">{detail}</p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/"
            className="rounded-full bg-gold-sheen px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
          >
            Back to home
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-gold/50 px-6 py-3 text-sm text-bone transition hover:border-gold"
          >
            Try again
          </button>
        </div>
      </Container>
    </main>
  );
}
