import { useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../components/ui/Button'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-20">
      <div className="container-page text-center">
        <p className="text-sm font-semibold tabular-nums text-accent">404</p>
        <h1 className="mt-3 text-display-lg font-semibold text-ink">
          We could not find that page.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted">
          The link may be out of date, or the page may have moved. Neither is your fault.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          {/*
            "Go back" uses history rather than a fixed route, so a visitor who
            mistyped a URL returns to whatever they were actually reading.
          */}
          <Button variant="secondary" size="lg" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <ButtonLink to="/" variant="primary" size="lg">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
