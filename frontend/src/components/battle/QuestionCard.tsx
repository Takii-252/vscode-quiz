import { useState } from 'react'
import type { OsType } from '../../types/shortcut'
import type { BattleMode } from '../../types/battle'
import ShortcutInput from './ShortcutInput'

interface QuestionCardProps {
  questionId: number | null
  prompt: string
  os: OsType
  mode: BattleMode
  attempts: number
  hintShown: boolean
  isLoading?: boolean
  onSubmit: (keys: string[]) => void
  onHint: () => void
  onEnemyTurn: () => void
  onReset: () => void
}

export default function QuestionCard({
  questionId,
  prompt,
  os,
  mode,
  attempts,
  hintShown,
  isLoading = false,
  onSubmit,
  onHint,
  onEnemyTurn,
  onReset,
}: QuestionCardProps) {
  const [pendingKeys, setPendingKeys] = useState<string[]>([])
  const isDisabled = mode !== 'asking' || isLoading

  function handleSubmit() {
    if (pendingKeys.length === 0 || isDisabled) return
    onSubmit(pendingKeys)
    setPendingKeys([])
  }

  return (
    <div className="panel p-4 flex flex-col gap-4">
      {/* 問題文 */}
      <div>
        <p className="text-xs text-slate-500 mb-1">もんだい</p>
        <p className="text-base font-semibold text-slate-100">
          {isLoading ? '問題をロード中...' : questionId ? `「${prompt}」` : '問題をロード中...'}
        </p>
      </div>

      {/* 入力エリア + たたかうボタン */}
      <div className="flex gap-3 items-stretch">
        <div className="flex-1">
          <ShortcutInput
            os={os}
            disabled={isDisabled}
            onCapture={keys => setPendingKeys(keys)}
          />
        </div>
        <button
          className="btn-attack"
          onClick={handleSubmit}
          disabled={isDisabled || pendingKeys.length === 0}
        >
          たたかう
        </button>
      </div>

      {/* サブボタン */}
      <div className="flex gap-2 flex-wrap">
        <button className="btn-secondary" onClick={onHint} disabled={isDisabled}>
          ヒント
        </button>
        <button className="btn-secondary" onClick={onEnemyTurn} disabled={isDisabled}>
          敵のターンを進める
        </button>
        <button className="btn-secondary" onClick={onReset}>
          リセット
        </button>
      </div>

      {/* デバッグ情報 */}
      <div className="debug-bar">
        attempts: {attempts} &nbsp;|&nbsp;
        hintShown: {hintShown.toString()} &nbsp;|&nbsp;
        state: {mode}
      </div>
    </div>
  )
}
