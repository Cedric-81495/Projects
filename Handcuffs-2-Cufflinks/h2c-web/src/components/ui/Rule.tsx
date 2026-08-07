/** Labelled horizontal rule used to break long story sections. */
export function Rule({ label }: { label: string }) {
  return (
    <div className="hr">
      <i />
      <b>{label}</b>
      <i />
    </div>
  );
}
