import { useNavigate } from 'react-router-dom'
import { useBattleStore } from '../features/battle/stores/battleStore'
import type { OsType } from '../types/shortcut'

export default function TitlePage() {
  const navigate = useNavigate()
  const initialize = useBattleStore(s => s.initialize)
  const osType = useBattleStore(s => s.osType)
  const setOsType = useBattleStore(s => s.setOsType)

  function handleStart() {
    initialize(osType)
    navigate('/battle')
  }

  return (
    <div className="title-bg">
      <div className="text-center flex flex-col items-center gap-8 px-4">
        {/* タイトル */}
        <div>
          <p className="text-sm text-blue-400 tracking-widest mb-2">VS Code Quest</p>
          <h1
            className="title-glow text-5xl font-bold text-white"
            style={{ letterSpacing: '-1px' }}
          >
            ショートカット<br />バトル！
          </h1>
          <p className="mt-4 text-slate-400 text-sm max-w-xs mx-auto">
            VS Code のショートカットキーを<br />バトルで楽しく覚えよう
          </p>
        </div>

        {/* OS切替 */}
        <div className="panel p-4 flex flex-col gap-3 min-w-[260px]">
          <p className="text-xs text-slate-400 text-center">対象OS を選択</p>
          <div className="flex gap-2">
            {(['mac', 'windows'] as OsType[]).map(os => (
              <button
                key={os}
                onClick={() => setOsType(os)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  osType === os
                    ? 'bg-blue-600 text-white border border-blue-400'
                    : 'btn-secondary'
                }`}
              >
                {os === 'mac' ? '🍎 Mac' : '🪟 Windows'}
              </button>
            ))}
          </div>
        </div>

        {/* スタートボタン */}
        <button
          className="btn-attack text-lg px-10 py-4"
          onClick={handleStart}
        >
          ⚔️ バトル開始！
        </button>

        <p className="text-xs text-slate-600">
          ※モック: 演出/数値/問題DBは仮
        </p>
      </div>
    </div>
  )
}
