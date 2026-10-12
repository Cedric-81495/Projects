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
