import { useRef, useState, useCallback, useEffect } from 'react'
import type { OsType } from '../../types/shortcut'
import { normalizeShortcutFromKeys, displayShortcut } from '../../utils/normalizeShortcut'

interface ShortcutInputProps {
  onCapture: (keys: string[]) => void
  disabled?: boolean
  os: OsType
}

const MODIFIER_KEYS = new Set(['Meta', 'Control', 'Alt', 'Shift'])

export default function ShortcutInput({ onCapture, disabled = false, os }: ShortcutInputProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [capturedKeys, setCapturedKeys] = useState<string[]>([])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const keys: string[] = []
      if (e.metaKey) keys.push('Meta')
      if (e.ctrlKey) keys.push('Control')
      if (e.altKey) keys.push('Alt')
      if (e.shiftKey) keys.push('Shift')

      if (!MODIFIER_KEYS.has(e.key)) {
        keys.push(e.key)
      }

      // モディファイアキーのみの場合は更新しない
      const hasNonModifier = keys.some(k => !MODIFIER_KEYS.has(k))
      if (hasNonModifier) {
        setCapturedKeys(keys)
        onCapture(keys)
      }
    },
    [onCapture]
  )

  useEffect(() => {
    const el = divRef.current
    if (!el) return
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const displayText = capturedKeys.length > 0
    ? displayShortcut(normalizeShortcutFromKeys(capturedKeys), os)
    : null

  return (
    <div
      ref={divRef}
      tabIndex={disabled ? -1 : 0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={() => !disabled && divRef.current?.focus()}
      className={`shortcut-input-area flex items-center gap-2 px-4 py-3 min-h-[52px] ${isFocused ? 'focused' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      role="textbox"
      aria-label="ショートカットキー入力エリア"
      aria-disabled={disabled}
    >
      {displayText ? (
        <span className="key-badge">{displayText}</span>
      ) : (
        <span className="text-sm text-slate-500">
          {isFocused ? 'キーを押してね...' : 'ここをクリックしてキーを押してね'}
        </span>
      )}
    </div>
  )
}
