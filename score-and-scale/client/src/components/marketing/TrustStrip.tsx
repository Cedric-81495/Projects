/**
 * Social-proof band directly under the hero.
 *
 * Text wordmarks rather than logo images: nothing to download, nothing to
 * layout-shift, and it scales cleanly in both themes.
 */
const PARTNERS = ['Northgate Capital', 'Meridian Lending', 'Halcyon Bank', 'Ardent Credit Union', 'Blackford Finance']

export function TrustStrip() {
  return (
    <div className="border-y border-line bg-raised/60 py-7">
      <div className="container-page">
        <p className="text-center text-xs font-medium uppercase tracking-[0.14em] text-subtle">
          Trusted by members working with
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-9 gap-y-3">
          {PARTNERS.map((partner) => (
            <li
              key={partner}
              className="text-sm font-semibold tracking-[-0.01em] text-muted/80"
            >
              {partner}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
