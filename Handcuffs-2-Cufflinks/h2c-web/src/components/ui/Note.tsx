export function Note({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="note">
      <b>{label}</b>
      <p>{children}</p>
    </div>
  );
}
