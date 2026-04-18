import { useNavigate } from 'react-router-dom'
import { useBattleStore } from '../features/battle/stores/battleStore'

export default function ResultPage() {
  const navigate = useNavigate()
  const mode = useBattleStore(s => s.mode)
  const score = useBattleStore(s => s.score)
  const correctCount = useBattleStore(s => s.correctCount)
  const wrongCount = useBattleStore(s => s.wrongCount)
  const hintCount = useBattleStore(s => s.hintCount)
  const initialize = useBattleStore(s => s.initialize)

  const total = correctCount + wrongCount
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0

  const isWin = mode === 'win'

  function handleRetry() {
    initialize()
    navigate('/battle')
  }

  return (
    <div className="title-bg">
      <div className="text-center flex flex-col items-center gap-6 px-4">
        {/* 結果タイトル */}
        <div>
          <p
            className="text-5xl mb-3"
            style={{ filter: 'drop-shadow(0 0 12px currentColor)' }}
          >
            {isWin ? '🎉' : '💀'}
          </p>
          <h1
            className="text-4xl font-bold"
            style={{
              color: isWin ? '#86efac' : '#fca5a5',
              textShadow: `0 0 20px ${isWin ? 'rgba(134,239,172,0.6)' : 'rgba(252,165,165,0.6)'}`,
            }}
          >
            {isWin ? 'バトル勝利！' : 'バトル敗北...'}
          </h1>
        </div>

        {/* スコアカード */}
        <div className="panel p-6 min-w-[300px] flex flex-col gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-500">スコア</p>
            <p className="text-4xl font-bold text-yellow-400">{score}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center">
              <p className="text-xs text-slate-500">正解数</p>
              <p className="text-2xl font-bold text-green-400">{correctCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">ミス数</p>
              <p className="text-2xl font-bold text-red-400">{wrongCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">ヒント使用</p>
              <p className="text-2xl font-bold text-yellow-300">{hintCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">正答率</p>
              <p className="text-2xl font-bold text-blue-300">{accuracy}%</p>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <button className="btn-attack px-8 py-3" onClick={handleRetry}>
            ⚔️ もう一度！
          </button>
          <button
            className="btn-secondary px-6 py-3"
            onClick={() => navigate('/')}
          >
            タイトルへ
          </button>
        </div>
      </div>
    </div>
  )
}
