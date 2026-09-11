GWOP University — card padding fix, 2026-09-11
==============================================

One file. Unzip over the repo root (the folder holding package.json):

    cd /path/to/gwop-university
    unzip -o ~/Downloads/gwop-university-card-padding.zip

Replaces:  src/styles/funnel.css

This SUPERSEDES the funnel.css in gwop-university-changes.zip — it is that
file plus the padding block appended. If you have not applied the earlier
zip yet, apply it first, then this one. If you already have, this is the
only file that changes.

WHAT CHANGED
------------
  .fn-path-card padding    22px 20px  ->  28px 24px 24px
  .fn-path-foot padding-top      14px ->  18px
  .fn-class     padding-right     0   ->  6px
  .fn-path-bp   margin-top        0   ->  2px
  plus a 430px block dialling the card padding back down on phones

WHY THE OLD VALUE LOOKED WRONG
------------------------------
The card has a 14px border-radius. The corner curves inward through the top
and bottom of the padding box, so the first and last lines of text have less
clearance than the ones in the middle. The eyebrow and the price looked worst
because they are the two nearest a corner. Padding has to clear the radius,
not match it.

CHECK
-----
    npm run build

No browser here, so the values are reasoned rather than seen. Worth a look
at three widths:

  ~1280px+   four across, Level 4's two-line eyebrow clear of the right edge
  ~900px     two across
  390px      one column, text not squeezed into a ribbon

If it now reads loose rather than tight, drop the horizontal back to 22px —
that is the one value I would expect to need a second pass.
