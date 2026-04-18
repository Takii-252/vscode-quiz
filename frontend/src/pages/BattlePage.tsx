import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBattleStore } from '../features/battle/stores/battleStore'
import type { OsType } from '../types/shortcut'
import PlayerPanel from '../components/battle/PlayerPanel'
import MonsterPanel from '../components/battle/MonsterPanel'
import BattleLog from '../components/battle/BattleLog'
import QuestionCard from '../components/battle/QuestionCard'

export default function BattlePage() {
  const navigate = useNavigate()

  const mode = useBattleStore(s => s.mode)
  const osType = useBattleStore(s => s.osType)
  const setOsType = useBattleStore(s => s.setOsType)
  const playerHp = useBattleStore(s => s.playerHp)
  const playerMaxHp = useBattleStore(s => s.playerMaxHp)
  const enemyHp = useBattleStore(s => s.enemyHp)
  const currentMonster = useBattleStore(s => s.currentMonster)
  const currentQuestion = useBattleStore(s => s.currentQuestion)
  const logs = useBattleStore(s => s.logs)
  const attempts = useBattleStore(s => s.attempts)
  const hintShown = useBattleStore(s => s.hintShown)
  const submitAnswer = useBattleStore(s => s.submitAnswer)
  const showHint = useBattleStore(s => s.showHint)
  const enemyTurn = useBattleStore(s => s.enemyTurn)
  const reset = useBattleStore(s => s.reset)
  const initialize = useBattleStore(s => s.initialize)

  // 初回マウント時に初期化（未初期化なら）
  useEffect(() => {
    if (mode === 'idle') {
      initialize()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // win/lose になったらリザルトページへ
  useEffect(() => {
    if (mode === 'win' || mode === 'lose') {
      const t = setTimeout(() => navigate('/result'), 2000)
      return () => clearTimeout(t)
    }
  }, [mode, navigate])

  return (
    <div className="min-h-screen p-4 flex flex-col gap-3" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* トップバー */}
      <div className="flex justify-between items-center px-1">
        <h1 className="text-base font-bold text-blue-300 tracking-wide">
          VS Code Quest<span className="text-xs text-slate-500 ml-1">(モック)</span>
        </h1>
        <div className="flex items-center gap-3">
          {/* OS切替 */}
          <div className="flex gap-1">
            {(['mac', 'windows'] as OsType[]).map(os => (
              <button
                key={os}
                onClick={() => setOsType(os)}
                className={`text-xs px-3 py-1 rounded transition-all ${
                  osType === os
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {os === 'mac' ? 'Mac' : 'Windows'}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">
            OS: <span className="text-slate-300">{osType}</span>
            {' / '}Mode: <span className="text-slate-300">action-to-shortcut</span>
          </span>
        </div>
      </div>

      {/* WIN / LOSE バナー */}
      {(mode === 'win' || mode === 'lose') && (
        <div
          className="text-center py-3 rounded-lg font-bold text-lg"
          style={{
            background: mode === 'win'
              ? 'rgba(21, 128, 61, 0.6)'
              : 'rgba(153, 27, 27, 0.6)',
            border: `1px solid ${mode === 'win' ? '#22c55e' : '#ef4444'}`,
          }}
        >
          {mode === 'win' ? '🎉 勝利！　リザルトへ...' : '💀 敗北...　リザルトへ...'}
        </div>
      )}

      {/* メイン3カラム */}
      <div
        className="flex-1 grid gap-3"
        style={{ gridTemplateColumns: '220px 1fr 220px', minHeight: '480px' }}
      >
        {/* 左: プレイヤー */}
        <PlayerPanel name="あなた" hp={playerHp} maxHp={playerMaxHp} />

        {/* 中央 */}
        <div className="flex flex-col gap-3">
          {/* バトルログ */}
          <BattleLog logs={logs} />

          {/* 問題エリア */}
          <QuestionCard
            question={currentQuestion}
            os={osType}
            mode={mode}
            attempts={attempts}
            hintShown={hintShown}
            onSubmit={submitAnswer}
            onHint={showHint}
            onEnemyTurn={enemyTurn}
            onReset={reset}
          />
        </div>

        {/* 右: モンスター */}
        <MonsterPanel monster={currentMonster} hp={enemyHp} />
      </div>

      {/* フッター */}
      <p className="text-center text-xs text-slate-700">
        ※モック: 演出/数値/問題DBは仮。ここから設計に合わせて固めよう。
      </p>
    </div>
  )
}
