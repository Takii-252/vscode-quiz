import { create } from 'zustand'
import type { Question, OsType } from '../../../types/shortcut'
import type { BattleMode, Monster } from '../../../types/battle'
import { questions as allQuestions, monsters } from '../../../data/questions'
import { judgeShortcut } from '../../../utils/judgeShortcut'
import { normalizeShortcutFromKeys, displayShortcut } from '../../../utils/normalizeShortcut'

const PLAYER_MAX_HP = 5
const CORRECT_DAMAGE = 4
const HINT_DAMAGE = 2
const ENEMY_DAMAGE = 2
const MAX_ATTEMPTS = 3

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

interface BattleStore {
  // 状態
  mode: BattleMode
  osType: OsType
  playerHp: number
  playerMaxHp: number
  enemyHp: number
  enemyMaxHp: number
  currentQuestion: Question | null
  logs: string[]
  attempts: number
  hintShown: boolean
  hintStep: number
  score: number
  currentMonster: Monster
  questionQueue: Question[]
  questionIndex: number
  // 集計
  correctCount: number
  wrongCount: number
  hintCount: number

  // アクション
  initialize: (os?: OsType) => void
  setOsType: (os: OsType) => void
  submitAnswer: (keys: string[]) => void
  showHint: () => void
  enemyTurn: () => void
  reset: () => void
}

function buildInitialState(os: OsType = 'mac') {
  const queue = shuffleArray(allQuestions)
  const monster = { ...monsters[0] }
  return {
    mode: 'asking' as BattleMode,
    osType: os,
    playerHp: PLAYER_MAX_HP,
    playerMaxHp: PLAYER_MAX_HP,
    enemyHp: monster.maxHp,
    enemyMaxHp: monster.maxHp,
    currentQuestion: queue[0] ?? null,
    logs: ['VS Code ショートカットクイズ バトル開始！', 'モンスターがあらわれた！'],
    attempts: 0,
    hintShown: false,
    hintStep: 0,
    score: 0,
    currentMonster: monster,
    questionQueue: queue,
    questionIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    hintCount: 0,
  }
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  ...buildInitialState(),

  initialize(os) {
    const initial = buildInitialState(os ?? get().osType)
    set(initial)
  },

  setOsType(os) {
    set({ osType: os })
  },

  submitAnswer(keys) {
    const state = get()
    if (state.mode !== 'asking') return
    if (keys.length === 0) return

    const { currentQuestion, osType, hintShown, questionQueue, questionIndex } = state

    if (!currentQuestion) return

    const isCorrect = judgeShortcut(keys, currentQuestion, osType)

    if (isCorrect) {
      const damage = hintShown ? HINT_DAMAGE : CORRECT_DAMAGE
      const newEnemyHp = Math.max(0, state.enemyHp - damage)
      const newLogs = [
        ...state.logs,
        `あなたのこうげき！ ${damage} ダメージ！`,
        `あなたはせいかいした！`,
      ]
      const newScore = state.score + (hintShown ? 5 : 10)
      const newCorrectCount = state.correctCount + 1

      if (newEnemyHp <= 0) {
        // 勝利
        set({
          enemyHp: 0,
          logs: [...newLogs, 'モンスターをたおした！'],
          mode: 'win',
          score: newScore,
          correctCount: newCorrectCount,
          attempts: 0,
          hintShown: false,
          hintStep: 0,
        })
        return
      }

      // 次の問題へ
      const nextIndex = questionIndex + 1
      if (nextIndex >= questionQueue.length) {
        set({
          enemyHp: newEnemyHp,
          logs: [...newLogs, 'すべての問題をクリアした！'],
          mode: 'win',
          score: newScore,
          correctCount: newCorrectCount,
          attempts: 0,
          hintShown: false,
          hintStep: 0,
        })
        return
      }

      const nextQuestion = questionQueue[nextIndex]
      set({
        enemyHp: newEnemyHp,
        logs: [...newLogs, 'つぎのもんだい！'],
        currentQuestion: nextQuestion,
        questionIndex: nextIndex,
        attempts: 0,
        hintShown: false,
        hintStep: 0,
        mode: 'asking',
        score: newScore,
        correctCount: newCorrectCount,
      })
    } else {
      // 不正解
      const newAttempts = state.attempts + 1
      const inputDisplay = displayShortcut(normalizeShortcutFromKeys(keys), osType)
      const newLogs = [...state.logs, `まちがい... (${inputDisplay})`]

      if (newAttempts >= MAX_ATTEMPTS) {
        // 敵のターン
        const newPlayerHp = Math.max(0, state.playerHp - ENEMY_DAMAGE)
        const logsAfterEnemy = [
          ...newLogs,
          `モンスターのこうげき！ ${ENEMY_DAMAGE} ダメージ！`,
        ]

        if (newPlayerHp <= 0) {
          set({
            playerHp: 0,
            logs: [...logsAfterEnemy, 'あなたはたおれた...'],
            mode: 'lose',
            wrongCount: state.wrongCount + 1,
          })
          return
        }

        const nextIndex = questionIndex + 1
        if (nextIndex >= questionQueue.length) {
          set({
            playerHp: newPlayerHp,
            logs: [...logsAfterEnemy, 'すべての問題が終わった！'],
            mode: 'win',
            wrongCount: state.wrongCount + 1,
            attempts: 0,
            hintShown: false,
            hintStep: 0,
          })
          return
        }

        set({
          playerHp: newPlayerHp,
          logs: [...logsAfterEnemy, 'つぎのもんだい！'],
          currentQuestion: questionQueue[nextIndex],
          questionIndex: nextIndex,
          attempts: 0,
          hintShown: false,
          hintStep: 0,
          mode: 'asking',
          wrongCount: state.wrongCount + 1,
        })
      } else {
        set({
          attempts: newAttempts,
          logs: newLogs,
          mode: 'asking',
          wrongCount: state.wrongCount + 1,
        })
      }
    }
  },

  showHint() {
    const state = get()
    if (state.mode !== 'asking' || !state.currentQuestion) return

    const { hintStep, currentQuestion } = state
    if (hintStep === 0) {
      set({
        hintShown: true,
        hintStep: 1,
        hintCount: state.hintCount + 1,
        logs: [...state.logs, `ヒント: ${currentQuestion.hint1}`],
      })
    } else if (hintStep === 1) {
      set({
        hintStep: 2,
        hintCount: state.hintCount + 1,
        logs: [...state.logs, `ヒント: ${currentQuestion.hint2}`],
      })
    }
  },

  enemyTurn() {
    const state = get()
    if (state.mode !== 'asking') return

    const newPlayerHp = Math.max(0, state.playerHp - ENEMY_DAMAGE)
    const newLogs = [
      ...state.logs,
      `敵のターン: モンスターのこうげき！ ${ENEMY_DAMAGE} ダメージ！`,
    ]

    if (newPlayerHp <= 0) {
      set({
        playerHp: 0,
        logs: [...newLogs, 'あなたはたおれた...'],
        mode: 'lose',
      })
      return
    }

    const nextIndex = state.questionIndex + 1
    if (nextIndex >= state.questionQueue.length) {
      set({
        playerHp: newPlayerHp,
        logs: [...newLogs, 'すべての問題が終わった！'],
        mode: 'win',
        attempts: 0,
        hintShown: false,
        hintStep: 0,
      })
      return
    }

    set({
      playerHp: newPlayerHp,
      logs: [...newLogs, 'つぎのもんだい！'],
      currentQuestion: state.questionQueue[nextIndex],
      questionIndex: nextIndex,
      attempts: 0,
      hintShown: false,
      hintStep: 0,
      mode: 'asking',
    })
  },

  reset() {
    set(buildInitialState(get().osType))
  },
}))
