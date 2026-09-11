GWOP University — card 1 padding, 2026-09-11
============================================

One file. Unzip over the repo root (the folder holding package.json):

    cd /path/to/gwop-university
    unzip -o ~/Downloads/gwop-university-card1-padding.zip

Replaces:  src/styles/funnel.css

SUPERSEDES both earlier zips' funnel.css. Apply this last.

THE ACTUAL CAUSE
----------------
Line ~355 held a rule from the old timeline layout:

    @media (min-width: 861px) {
      .fn-path-card:first-child { padding-left: 0; }
    }

It pulled card 1 flush with the section edge, which was right for bare
columns under a single gold rule and wrong the moment the cards gained a
border. Card 1 had no left padding while its three siblings had 24px, so
only card 1 looked broken.

Raising .fn-path-card padding could never have fixed it.
`.fn-path-card:first-child` is the more specific selector, so it won over
the later shorthand regardless of where that rule sat in the file. The
previous pass moved the other three cards and left this one untouched,
which is why it read as having done nothing.

Removed, with the original kept commented above it — the reasoning is
still correct for the layout it was written for.

ONE LANDMINE LEFT, DELIBERATELY NOT TOUCHED
-------------------------------------------
Line ~1078, inside @media (max-width: 860px):

    .fn-path-card { padding: 0; }

Also a timeline leftover. It has the SAME specificity as the new rule, so
the new one wins purely because it appears later in the file. That is true
today and fragile: anything appended to that 860px block, or any reordering
of the stylesheet, flips it back and the cards lose their padding below
860px. Worth deleting in a tidy-up pass, alongside .fn-dot, .fn-lvl and the
.fn-path-row::before timeline rule, which are all dead for this layout.

CHECK
-----
    npm run build

Then compare card 1 against card 2 at full width — that is the whole test.
Also 900px and 390px, since the removed rule was breakpoint-scoped.
