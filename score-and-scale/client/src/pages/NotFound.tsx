import { Link, useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-8 text-center bg-ink">
      <div className="max-w-md">
        <span className="font-mono text-xs uppercase tracking-wide text-brassBright mb-3.5 block">
          Error 404
        </span>
        <h1 className="font-display text-[clamp(32px,5vw,48px)] text-offwhite mb-3.5">
          Page not found
        </h1>
        <p className="text-paper2 mb-8">
          The page you're looking for doesn't exist, may have moved, or the link may be incorrect.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="border border-paper2 text-paper px-5 py-2.5 text-sm uppercase tracking-wide rounded-sm hover:border-brassBright hover:text-brassBright transition-colors"
          >
            Go back
          </button>
          <Link
            to="/"
            className="border border-brass px-5 py-2.5 text-sm uppercase tracking-wide rounded-sm hover:bg-brass hover:text-ink transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
