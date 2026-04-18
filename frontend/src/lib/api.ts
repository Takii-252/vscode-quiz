import type { OsType } from '../types/shortcut'

const API_BASE = 'http://localhost:8000'

// =====================
// レスポンス型
// =====================

export type NextQuestionResponse = {
  questionId: number
  prompt: string
  category: string
  difficulty: number
  monster: {
    name: string
    hp: number
    imageUrl: string
  }
}

export type JudgeRequest = {
  questionId: number
  os: OsType
  input: string[]
  usedHint?: boolean
}

export type JudgeResponse = {
  isCorrect: boolean
  normalizedInput: string
  acceptedAnswers: string[]
  damage: number
  message: string
}

export type HintResponse = {
  hint: string
}

export type SaveResultRequest = {
  userId?: string | null
  clearedCount: number
  correctCount: number
  wrongCount: number
  hintCount: number
  score: number
  playedAt?: string
}

export type SaveResultResponse = {
  status: 'ok'
  resultId: number
}

// =====================
// API関数
// =====================

export async function fetchNextQuestion(params: {
  os: OsType
  level?: number
  category?: string
  excludeIds?: number[]
}): Promise<NextQuestionResponse> {
  const qs = new URLSearchParams()
  qs.set('os', params.os)
  if (params.level) qs.set('level', String(params.level))
  if (params.category) qs.set('category', params.category)
  if (params.excludeIds?.length) qs.set('excludeIds', params.excludeIds.join(','))

  const res = await fetch(`${API_BASE}/api/questions/next?${qs.toString()}`)
  if (!res.ok) throw await res.json()
  return res.json() as Promise<NextQuestionResponse>
}

export async function judgeAnswer(body: JudgeRequest): Promise<JudgeResponse> {
  const res = await fetch(`${API_BASE}/api/questions/judge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usedHint: false, ...body }),
  })
  if (!res.ok) throw await res.json()
  return res.json() as Promise<JudgeResponse>
}

export async function fetchHint(
  questionId: number,
  step: 1 | 2,
  os: OsType
): Promise<HintResponse> {
  const qs = new URLSearchParams({ step: String(step), os })
  const res = await fetch(`${API_BASE}/api/questions/${questionId}/hint?${qs.toString()}`)
  if (!res.ok) throw await res.json()
  return res.json() as Promise<HintResponse>
}

export async function saveResult(body: SaveResultRequest): Promise<SaveResultResponse> {
  const res = await fetch(`${API_BASE}/api/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw await res.json()
  return res.json() as Promise<SaveResultResponse>
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`)
    return res.ok
  } catch {
    return false
  }
}
