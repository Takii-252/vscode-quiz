import { useEffect, useRef } from 'react'

interface BattleLogProps {
  logs: string[]
}

export default function BattleLog({ logs }: BattleLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // 新しいログが追加されたら自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="battle-log p-3 flex flex-col gap-1" style={{ minHeight: '160px', maxHeight: '200px' }}>
      {logs.map((log, i) => (
        <p
          key={i}
          className="text-sm leading-relaxed"
          style={{
            color: log.includes('せいかい') || log.includes('クリア') || log.includes('たおし')
              ? '#86efac'
              : log.includes('まちがい') || log.includes('たおれ') || log.includes('ダメージ')
              ? '#fca5a5'
              : log.includes('ヒント')
              ? '#fde68a'
              : '#cbd5e1',
          }}
        >
          {log}
        </p>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
