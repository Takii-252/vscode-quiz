import { create } from 'zustand'
import type { OsType } from '../../../types/shortcut'
import type { BattleMode, Monster } from '../../../types/battle'
import {
  fetchNextQuestion,
  judgeAnswer,
  fetchHint,
  type NextQuestionResponse,
} from '../../../lib/api'
import { normalizeShortcutFromKeys } from '../../../utils/normalizeShortcut'

const PLAYER_MAX_HP = 5
const ENEMY_DAMAGE = 2
const MAX_ATTEMPTS = 3

const DEFAULT_MONSTER: Monster = {
  id: 'slime',
  name: 'ショートカットスライム',
  maxHp: 12,
  emoji: '',
}

function monsterFromApi(m: NextQuestionResponse['monster']): Monster {
  return {
    id: m.name,
    name: m.name,
    maxHp: m.hp,
    emoji: '',
  }
}

interface BattleStore {
  mode: BattleMode
  osType: OsType
  playerHp: number
  playerMaxHp: number
  enemyHp: number
  enemyMaxHp: number
  currentQuestionId: number | null
  currentPrompt: string
  logs: string[]
  attempts: number
  hintShown: boolean
  hintStep: number
  score: number
  currentMonster: Monster
  askedIds: number[]
  correctCount: number
  wrongCount: number
  hintCount: number
  isLoading: boolean
  useApi: boolean

  initialize: (os?: OsType) => Promise<void>
  setOsType: (os: OsType) => void
  submitAnswer: (keys: string[]) => Promise<void>
  showHint: () => Promise<void>
  enemyTurn: () => Promise<void>
  reset: () => Promise<void>
}

function baseState(os: OsType = 'mac') {
  return {
    mode: 'idle' as BattleMode,
    osType: os,
    playerHp: PLAYER_MAX_HP,
    playerMaxHp: PLAYER_MAX_HP,
    enemyHp: DEFAULT_MONSTER.maxHp,
    enemyMaxHp: DEFAULT_MONSTER.maxHp,
    currentQuestionId: null,
    currentPrompt: '',
    logs: [],
    attempts: 0,
    hintShown: false,
    hintStep: 0,
    score: 0,
    currentMonster: DEFAULT_MONSTER,
    askedIds: [],
    correctCount: 0,
    wrongCount: 0,
    hintCount: 0,
    isLoading: false,
    useApi: true,
  }
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  ...baseState(),

  async initialize(os) {
    const osType = os ?? get().osType
    set({ ...baseState(osType), isLoading: true })
    try {
      const q = await fetchNextQuestion({ os: osType, excludeIds: [] })
      set({
        mode: 'asking',
        currentQuestionId: q.questionId,
        currentPrompt: q.prompt,
        currentMonster: monsterFromApi(q.monster),
        enemyHp: q.monster.hp,
        enemyMaxHp: q.monster.hp,
        logs: ['VS Code ショートカットクイズ バトル開始！', 'モンスターがあらわれた！'],
        askedIds: [q.questionId],
        isLoading: false,
      })
    } catch {
      set({ mode: 'asking', isLoading: false, logs: ['APIに接続できません。オフラインモードです。'] })
    }
  },

  setOsType(os) {
    set({ osType: os })
  },

  async submitAnswer(keys) {
    const state = get()
    if (state.mode !== 'asking' || !state.currentQuestionId) return
    if (keys.length === 0) return

    const normalizedInput = normalizeShortcutFromKeys(keys)
    const inputArr = normalizedInput.split('+')

    try {
      const result = await judgeAnswer({
        questionId: state.currentQuestionId,
        os: state.osType,
        input: inputArr,
        usedHint: state.hintShown,
      })

      if (result.isCorrect) {
        const newEnemyHp = Math.max(0, state.enemyHp - result.damage)
        const newScore = state.score + (state.hintShown ? 5 : 10)
        const newLogs = [
          ...state.logs,
          `あなたのこうげき！ ${result.damage} ダメージ！`,
          `あなたはせいかいした！`,
        ]

        if (newEnemyHp <= 0) {
          set({ enemyHp: 0, logs: [...newLogs, 'モンスターをたおした！'], mode: 'win', score: newScore, correctCount: state.correctCount + 1 })
          return
        }

        // 次の問題を取得
        set({ isLoading: true })
        try {
          const nextQ = await fetchNextQuestion({
            os: state.osType,
            excludeIds: state.askedIds,
          })
          set({
            enemyHp: newEnemyHp,
            enemyMaxHp: nextQ.monster.hp,
            logs: [...newLogs, 'つぎのもんだい！'],
            currentQuestionId: nextQ.questionId,
            currentPrompt: nextQ.prompt,
            currentMonster: monsterFromApi(nextQ.monster),
            askedIds: [...state.askedIds, nextQ.questionId],
            attempts: 0,
            hintShown: false,
            hintStep: 0,
            mode: 'asking',
            score: newScore,
            correctCount: state.correctCount + 1,
            isLoading: false,
          })
        } catch {
          set({ enemyHp: newEnemyHp, logs: [...newLogs, '全問クリア！'], mode: 'win', score: newScore, correctCount: state.correctCount + 1, isLoading: false })
        }
      } else {
        const newAttempts = state.attempts + 1
        const newLogs = [...state.logs, `まちがい... (${result.message})`]

        if (newAttempts >= MAX_ATTEMPTS) {
          const newPlayerHp = Math.max(0, state.playerHp - ENEMY_DAMAGE)
          const logsAfterEnemy = [...newLogs, `モンスターのこうげき！ ${ENEMY_DAMAGE} ダメージ！`]

          if (newPlayerHp <= 0) {
            set({ playerHp: 0, logs: [...logsAfterEnemy, 'あなたはたおれた...'], mode: 'lose', wrongCount: state.wrongCount + 1 })
            return
          }

          set({ isLoading: true })
          try {
            const nextQ = await fetchNextQuestion({ os: state.osType, excludeIds: state.askedIds })
            set({
              playerHp: newPlayerHp,
              logs: [...logsAfterEnemy, 'つぎのもんだい！'],
              currentQuestionId: nextQ.questionId,
              currentPrompt: nextQ.prompt,
              currentMonster: monsterFromApi(nextQ.monster),
              enemyMaxHp: nextQ.monster.hp,
              askedIds: [...state.askedIds, nextQ.questionId],
              attempts: 0,
              hintShown: false,
              hintStep: 0,
              mode: 'asking',
              wrongCount: state.wrongCount + 1,
              isLoading: false,
            })
          } catch {
            set({ playerHp: newPlayerHp, logs: [...logsAfterEnemy, '全問クリア！'], mode: 'win', wrongCount: state.wrongCount + 1, isLoading: false })
          }
        } else {
          set({ attempts: newAttempts, logs: newLogs, wrongCount: state.wrongCount + 1 })
        }
      }
    } catch {
      set({ logs: [...state.logs, 'APIエラーが発生しました'], mode: 'asking' })
    }
  },

  async showHint() {
    const state = get()
    if (state.mode !== 'asking' || !state.currentQuestionId) return

    const nextStep = (state.hintStep + 1) as 1 | 2
    if (nextStep > 2) return

    try {
      const result = await fetchHint(state.currentQuestionId, nextStep, state.osType)
      set({
        hintShown: true,
        hintStep: nextStep,
        hintCount: state.hintCount + 1,
        logs: [...state.logs, `ヒント: ${result.hint}`],
      })
    } catch {
      set({ logs: [...state.logs, 'ヒントを取得できませんでした'] })
    }
  },

  async enemyTurn() {
    const state = get()
    if (state.mode !== 'asking') return

    const newPlayerHp = Math.max(0, state.playerHp - ENEMY_DAMAGE)
    const newLogs = [...state.logs, `敵のターン: モンスターのこうげき！ ${ENEMY_DAMAGE} ダメージ！`]

    if (newPlayerHp <= 0) {
      set({ playerHp: 0, logs: [...newLogs, 'あなたはたおれた...'], mode: 'lose' })
      return
    }

    set({ isLoading: true })
    try {
      const nextQ = await fetchNextQuestion({ os: state.osType, excludeIds: state.askedIds })
      set({
        playerHp: newPlayerHp,
        logs: [...newLogs, 'つぎのもんだい！'],
        currentQuestionId: nextQ.questionId,
        currentPrompt: nextQ.prompt,
        currentMonster: monsterFromApi(nextQ.monster),
        enemyMaxHp: nextQ.monster.hp,
        askedIds: [...state.askedIds, nextQ.questionId],
        attempts: 0,
        hintShown: false,
        hintStep: 0,
        mode: 'asking',
        isLoading: false,
      })
    } catch {
      set({ playerHp: newPlayerHp, logs: [...newLogs, '全問クリア！'], mode: 'win', isLoading: false })
    }
  },

  async reset() {
    await get().initialize(get().osType)
  },
}))
