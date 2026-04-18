import heroImg from '../../assets/hero.png'
import HpBar from './HpBar'

interface PlayerPanelProps {
  name: string
  hp: number
  maxHp: number
  title?: string
}

export default function PlayerPanel({ name, hp, maxHp, title = '勇者' }: PlayerPanelProps) {
  return (
    <div className="panel p-4 flex flex-col gap-3 h-full">
      {/* 名前 */}
      <div>
        <p className="text-sm font-bold text-blue-300">{name}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          HP <span className="text-white font-semibold">{hp}</span>
          <span className="text-slate-500"> / {maxHp}</span>
        </p>
      </div>

      {/* HPバー */}
      <HpBar current={hp} max={maxHp} variant="player" />

      {/* 画像 */}
      <div className="flex-1 flex items-center justify-center py-2">
        <img
          src={heroImg}
          alt="プレイヤー"
          className="object-contain"
          style={{
            maxHeight: '180px',
            filter: hp <= 0 ? 'grayscale(1) opacity(0.5)' : 'none',
          }}
        />
      </div>

      {/* 称号 */}
      <p className="text-center text-xs text-slate-500">{title}</p>
    </div>
  )
}
