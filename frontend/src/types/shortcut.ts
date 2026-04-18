export type OsType = 'mac' | 'windows'

export interface Question {
  id: number
  prompt: string
  category: string
  difficulty: number
  answers: {
    mac: string[]
    windows: string[]
  }
  hint1: string
  hint2: string
}
