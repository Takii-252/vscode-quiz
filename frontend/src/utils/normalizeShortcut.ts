import type { OsType } from '../types/shortcut'

const MODIFIER_ORDER = ['Meta', 'Control', 'Alt', 'Shift'] as const

const KEY_ALIAS_MAP: Record<string, string> = {
  // Meta
  meta: 'Meta',
  cmd: 'Meta',
  command: 'Meta',
  '⌘': 'Meta',
  // Control
  ctrl: 'Control',
  control: 'Control',
  '⌃': 'Control',
  // Alt
  alt: 'Alt',
  option: 'Alt',
  '⌥': 'Alt',
  // Shift
  shift: 'Shift',
  '⇧': 'Shift',
}

/** 単一キー文字列を正規化する */
export function normalizeKey(key: string): string {
  const mapped = KEY_ALIAS_MAP[key.toLowerCase()]
  if (mapped) return mapped
  // 単文字はアッパーケースに統一
  if (key.length === 1) return key.toUpperCase()
  return key
}

/** キー配列 → 正規化ショートカット文字列 (例: ['meta','f'] → 'Meta+F') */
export function normalizeShortcutFromKeys(keys: string[]): string {
  const normalized = keys.map(normalizeKey)
  const modifiers = MODIFIER_ORDER.filter(m => normalized.includes(m))
  const others = normalized.filter(k => !(MODIFIER_ORDER as readonly string[]).includes(k))
  return [...modifiers, ...others].join('+')
}

/** 文字列形式のショートカットを正規化する (例: 'Cmd+F' → 'Meta+F') */
export function normalizeShortcutString(input: string): string {
  const keys = input.split('+').map(k => normalizeKey(k.trim()))
  const modifiers = MODIFIER_ORDER.filter(m => keys.includes(m))
  const others = keys.filter(k => !(MODIFIER_ORDER as readonly string[]).includes(k))
  return [...modifiers, ...others].join('+')
}

/** 正規化済みショートカットを表示用に変換する */
export function displayShortcut(normalized: string, os: OsType): string {
  return normalized
    .split('+')
    .map(key => {
      if (os === 'mac') {
        if (key === 'Meta') return '⌘'
        if (key === 'Control') return '⌃'
        if (key === 'Alt') return '⌥'
        if (key === 'Shift') return '⇧'
      } else {
        if (key === 'Meta') return 'Win'
        if (key === 'Control') return 'Ctrl'
        if (key === 'Alt') return 'Alt'
        if (key === 'Shift') return 'Shift'
      }
      return key
    })
    .join(' + ')
}
