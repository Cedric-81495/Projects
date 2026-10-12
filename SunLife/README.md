# [Firm Name] — advisor site (sample)

A single-page React/Vite site for a financial advisor, with a short
"curtain" load-in before the hero content settles in.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview   # preview the production build locally
```

## Deploy to Vercel

Push this folder to a GitHub repo, then import it in Vercel —
it auto-detects Vite (build command `vite build`, output dir `dist`).
Or from the CLI, inside this folder:

```bash
npm i -g vercel
vercel
```

## Before going live, replace every [bracketed] placeholder

- `[Firm Name]`, `[Advisor Name]`, `[Company Name]` — in `src/App.jsx`
  (Header, Story, Quote, Footer) and `index.html` (`<title>`)
- `[Advisor photo]` placeholders in `Hero` and `Story` — swap the
  `.photo-placeholder` divs for real `<img>` tags
- `[Phone Placeholder]`, `[Email Placeholder]`, `[City, region placeholder]`
  — in `Hero`, `FinalCTA`, `Footer`
- Testimonials — replace the three placeholder quotes in `Testimonials`
  with real, permissioned client quotes
- Services — the four cards are generic categories (income protection,
  critical illness, etc.); rename/replace to match what your client
  actually sells

## Customizing the look

Colors, type, and spacing are CSS custom properties at the top of
`src/index.css` (`--accent`, `--deep`, `--paper`, etc.) — change the
hex values there to re-theme the whole site.

## The "Book a consultation" page and Systeme.io

`/book-consultation` is a separate route (`src/BookConsultation.jsx`)
with a 6-question qualifying form that submits to
`api/submit-consultation.js`, a Vercel serverless function. That
function is the **only** place the real Systeme.io API key ever
lives — the browser never sees it.

**Right now (no API key set):** the form fully works end-to-end —
answers are validated and the completed lead is logged in Vercel's
function logs — but nothing is sent to Systeme.io. This is normal and
expected for testing.

**Once the client has signed up and paid for a Systeme.io plan,**
follow the setup checklist at the top of `api/submit-consultation.js`:
generate an API key, create the matching custom fields in Systeme.io,
and add `SYSTEME_IO_API_KEY` (and optionally `ALLOWED_ORIGIN`) as
Vercel environment variables. No frontend code changes are needed —
flipping that one env var on is the entire switch from test mode to
live.

### Testing the serverless function locally

`npm run dev` (plain Vite) only serves the frontend — it does not run
`/api` functions. To test the full form locally, including the
function, use the Vercel CLI instead:

```bash
npm i -g vercel
vercel dev
```

This reads `.env` for `SYSTEME_IO_API_KEY` / `ALLOWED_ORIGIN` (see
`.env.example`) the same way production does.
