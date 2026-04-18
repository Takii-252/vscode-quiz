interface HpBarProps {
  current: number
  max: number
  variant?: 'player' | 'enemy'
}

export default function HpBar({ current, max, variant = 'player' }: HpBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0

  return (
    <div className="hp-bar-track" style={{ height: '10px' }}>
      <div
        className={variant === 'player' ? 'hp-bar-fill-player' : 'hp-bar-fill-enemy'}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
