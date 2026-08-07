/**
 * The cufflink: two hairlines closed by a linked pair of rings.
 *
 * This is the site's signature mark and the only recurring ornament. It opens
 * every section eyebrow. Because it is the one repeated flourish, nothing else
 * in the system needs to shout — keep new decoration out.
 *
 * The markup uses <i>/<u>/<s>/<b> purely as unstyled hooks for the four shapes;
 * they carry no semantic weight, and the whole mark is hidden from assistive
 * technology because the adjacent label already names the section.
 */
export function Cuff() {
  return (
    <span className="cuff" aria-hidden="true">
      <i />
      <u />
      <s />
      <b />
      <i />
    </span>
  );
}
