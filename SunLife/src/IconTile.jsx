export function IconTile({ icon: Icon, tone = 'soft', size = 22 }) {
  return (
    <span className={`icon-tile icon-tile--${tone}`} aria-hidden="true">
      <Icon size={size} strokeWidth={1.75} />
    </span>
  )
}
