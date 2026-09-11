GWOP University — changed files, 2026-09-11
===========================================

Unzip over the repo root (the folder holding package.json). Paths already
match, so nothing needs moving and no file needs renaming.

    cd /path/to/gwop-university
    unzip -o ~/Downloads/gwop-university-changes.zip

-o overwrites without prompting. Six files are replaced:

  src/app/(marketing)/membership/page.tsx
  src/app/(marketing)/membership/PlanCard.tsx
  src/components/funnel/Sections.tsx
  src/styles/funnel.css
  src/config/membership.ts
  src/app/830/page.tsx

Note the parentheses in (marketing) — that is a Next.js route group and is
part of the real directory name. Some unzip GUIs are fine with it; if yours
mangles it, use the command line.

Check it landed:

    git status            # expect exactly these six, all modified
    npm run typecheck     # passed here on a clean install
    npm run build

WHAT CHANGED
------------
membership/page.tsx + PlanCard.tsx
  · "Includes stages 1-N" promised access 0014 removed. Reads
    grants_cumulative now. The bundle and Level 4 are both grants_level 4,
    so that flag is the only thing telling them apart.
  · owned= marked the bundle as enrolled for anyone holding Level 4 alone.
  · imports portal.css — the page had no stylesheet on a cold load.

funnel Sections.tsx + funnel.css + 830/page.tsx
  · PathwayAndBundle split into Pathway and Bundle, separate sections.
  · Pathway on a 1280px wrap. --max deliberately untouched.
  · Price numeral and term split, both nowrap.
  · Card hover lift. No pointer cursor while LEVEL_PAGES_OPEN is false.

config/membership.ts
  · LEVEL_PAGES_OPEN = false and levelHref(). Flip to true when the level
    pages exist AND checkout takes a card.

TWO THINGS I COULD NOT VERIFY HERE
----------------------------------
1. next build could not finish in the sandbox — fonts.googleapis.com is
   not reachable, so next/font fails. Typecheck passes and the CSS braces
   balance. It should compile for you; run the build before pushing.

2. No browser here, so the responsive behaviour is unverified. Check the
   funnel at 390px and around 900px. The new 2-column rule is bounded as
   (min-width: 431px) and (max-width: 1180px) on purpose: an existing 430px
   block earlier in the file sets one column, and an unbounded rule would
   have won the cascade and put two cards side by side on a phone.

STILL OPEN, UNRELATED TO THIS ZIP
---------------------------------
  · membership_plans.description is populated and now duplicates the
    entitlement line on the cards. Clear it or write real copy:
        update public.membership_plans set description = null;
  · BrandBar renders "Sign in" as an inert span, never a session check.
    Frozen for 8/30 and never restored. src/components/Chrome.tsx.
