import { DOWNLOAD_STATUS, type DownloadStatus } from '@/content/modules'

const LABEL: Record<DownloadStatus, string> = {
  ships: 'Ships',
  extract: 'Extract',
  build: 'Build',
}
const CHIP: Record<DownloadStatus, string> = {
  ships: 'ok',
  extract: 'wait',
  build: 'miss',
}
const MARK: Record<DownloadStatus, string> = {
  ships: '\u2713',
  extract: '\u2702',
  build: '+',
}

/* ═══ DOWNLOADS ═════════════════════════════════════════════════════════════
   Thirteen worksheets and checklists: four in Level 1, three in each of the
   others.

   ⚠ TITLES ARE NOT DUPLICATED HERE. DOWNLOAD_STATUS is keyed by the title
   content/pathway.ts already renders on the funnel, so the sales page and this
   page cannot drift into naming different things. If a title changes there, it
   stops matching here and the row disappears — which is a louder failure than
   two lists quietly disagreeing.

   ⚠ `from` IS A PRODUCTION INSTRUCTION, NOT STUDENT-FACING COPY. "Starter Kit
   M4" tells Maui which document to cut the extract out of. It has never been
   rendered anywhere a buyer can see and should not be.

   THE THREE STATES:
     ships   — already exists as a finished PDF
     extract — has to be cut out of a larger document that does exist
     build   — does not exist in any form, usually a spreadsheet */
export default function AdminDownloads() {
  const rows = Object.entries(DOWNLOAD_STATUS)
  const n = (s: DownloadStatus) => rows.filter(([, d]) => d.status === s).length

  return (
    <div className="wrap">
      <div className="head">
        <p className="tag">Content status</p>
        <h2 className="h2">Downloads</h2>
        <p className="lede">
          The worksheets and checklists the funnel advertises. Two exist as
          finished PDFs; the rest are still to be cut or built.
        </p>
      </div>

      <div className="stats">
        <div className="stat"><b>{n('ships')}/{rows.length}</b><span>Finished</span></div>
        <div className="stat"><b>{n('extract')}</b><span>To extract</span></div>
        <div className="stat"><b>{n('build')}</b><span>To build</span></div>
        <div className="stat"><b>{n('extract') + n('build')}</b><span>Outstanding</span></div>
      </div>

      <div className="lvlblock">
        <div className="lvlhead">
          <h3>All downloads</h3>
          <span className="chip ok">{n('ships')} ships</span>
          <span className="chip wait">{n('extract')} extract</span>
          <span className="chip miss">{n('build')} build</span>
        </div>
        <div className="mods">
          {rows.map(([title, d]) => (
            <div className="mod" key={title}>
              <span className="mn">{MARK[d.status]}</span>
              <span>
                <h3>{title}</h3>
                <span className="meta">{d.from}</span>
              </span>
              <span className={`chip ${CHIP[d.status]}`}>{LABEL[d.status]}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="lede" style={{ marginTop: 8 }}>
        Per the Master Build &amp; Launch Requirements these do not block the
        first sale. They are advertised on the funnel, so a buyer who looks for
        one and cannot find it is a support ticket, not a refund.
      </p>
    </div>
  )
}
