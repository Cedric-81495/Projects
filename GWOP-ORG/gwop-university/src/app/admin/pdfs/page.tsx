import { COURSE_ASSETS } from '@/content/modules'

const LEVEL_ORDER = ['freshman', 'sophomore', 'junior', 'senior'] as const

/* ═══ COURSE PDFS ═══════════════════════════════════════════════════════════
   The twelve documents each level ships with.

   ⚠ "UPLOADED" MEANS `key` IS SET, NOT THAT SOMEONE TICKED A BOX. key is
   undefined until the file is actually in the bucket (modules.ts, build order
   item 3). A row without one renders no link on the level page and 404s from
   /api/v1/asset, so this column reflects whether the app can serve the file —
   not whether anybody believes it exists.

   ⚠ PAGE COUNTS APPEAR HERE AND NOWHERE ELSE. The master doc is explicit that
   they must never be published: Level 1 is the heaviest and the cheapest,
   Level 4 the lightest and the most expensive. Correct, and it reads badly in
   a table a buyer can see. This page is staff-only, and `pages` is exactly the
   production-tracking field it was recorded for.

   ⚠ THREE FILES SHIP IN TWO LEVELS EACH, PLUS THE FREE ONE IN ALL FOUR. That
   overlap is deliberate — it is what lets each level stand on its own. The
   level column below reads the `levels` array rather than the filename prefix,
   because GWOP-L1-Master-The-Money.pdf is a Level 2 asset too. */
export default function AdminPdfs() {
  const uploaded = COURSE_ASSETS.filter(a => a.key).length
  const shared = COURSE_ASSETS.filter(a => !a.free && a.levels.length > 1).length
  const pages = COURSE_ASSETS.filter(a => !a.free).reduce((s, a) => s + a.pages, 0)

  return (
    <div className="wrap">
      <div className="head">
        <p className="tag">Content status</p>
        <h2 className="h2">Course PDFs</h2>
        <p className="lede">
          The documents each level ships with. Uploaded means the file is in the
          private bucket and the app can sign a link to it.
        </p>
      </div>

      <div className="stats">
        <div className="stat"><b>{uploaded}/{COURSE_ASSETS.length}</b><span>Uploaded</span></div>
        <div className="stat"><b>{shared}</b><span>Shared across levels</span></div>
        <div className="stat"><b>{pages}</b><span>Paid pages</span></div>
        <div className="stat"><b>1</b><span>Free, all levels</span></div>
      </div>

      <div className="lvlblock">
        <div className="lvlhead">
          <h3>All documents</h3>
          <span className={`chip ${uploaded === COURSE_ASSETS.length ? 'ok' : 'miss'}`}>
            {uploaded === COURSE_ASSETS.length ? 'Complete' : `${COURSE_ASSETS.length - uploaded} outstanding`}
          </span>
        </div>
        <div className="mods">
          {COURSE_ASSETS.map(a => (
            <div className="mod" key={a.file}>
              <span className="mn">PDF</span>
              <span>
                <h3>{a.title}</h3>
                <span className="meta">
                  {a.pages}pp ·{' '}
                  {a.levels.length === 4
                    ? 'all levels'
                    : a.levels.map(l => `L${LEVEL_ORDER.indexOf(l) + 1}`).join(' + ')}
                  {a.free && <> · free</>} · {a.file}
                </span>
              </span>
              <span className={`chip ${a.key ? 'ok' : 'miss'}`}>
                {a.key ? 'Uploaded' : 'Not uploaded'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="lede" style={{ marginTop: 8 }}>
        Paid documents live in the private <code>course-materials</code> bucket under{' '}
        <code>notes/</code> and are served through <code>/api/v1/asset</code> with a link
        that expires. The free one is a public path and is meant to be shareable.
      </p>
    </div>
  )
}
