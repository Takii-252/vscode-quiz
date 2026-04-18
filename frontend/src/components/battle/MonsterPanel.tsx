import HpBar from './HpBar'
import type { Monster } from '../../types/battle'

interface MonsterPanelProps {
  monster: Monster
  hp: number
}

export default function MonsterPanel({ monster, hp }: MonsterPanelProps) {
  const isDead = hp <= 0

  return (
    <div className="panel p-4 flex flex-col gap-3 h-full">
      {/* 名前ヘッダー */}
      <p className="text-sm font-bold text-blue-300">モンスター</p>

      {/* HP */}
      <div>
        <p className="text-xs text-slate-400">
          HP <span className="text-white font-semibold">{hp}</span>
          <span className="text-slate-500"> / {monster.maxHp}</span>
        </p>
      </div>

      {/* HPバー */}
      <HpBar current={hp} max={monster.maxHp} variant="enemy" />

      {/* 画像エリア */}
      <div className="flex-1 flex items-center justify-center py-2">
        <div
          className="monster-icon select-none"
          style={{ opacity: isDead ? 0.3 : 1, transition: 'opacity 0.4s' }}
        >
          {monster.emoji}
        </div>
      </div>

      {/* モンスター名 */}
      <p className="text-center text-xs text-slate-400">{monster.name}</p>
    </div>
  )
}
