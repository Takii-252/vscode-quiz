import type { Question, OsType } from '../types/shortcut'
import { normalizeShortcutFromKeys, normalizeShortcutString } from './normalizeShortcut'

/**
 * ユーザーが入力したキー配列を問題の正解と照合する
 * @returns true = 正解
 */
export function judgeShortcut(
  keys: string[],
  question: Question,
  os: OsType
): boolean {
  if (keys.length === 0) return false
  const inputNormalized = normalizeShortcutFromKeys(keys)
  const correctAnswers = question.answers[os]
  return correctAnswers.some(
    answer => normalizeShortcutString(answer) === inputNormalized
  )
}
