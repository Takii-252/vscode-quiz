export type BattleMode =
  | 'idle'
  | 'asking'
  | 'judging'
  | 'win'
  | 'lose'

export interface Monster {
  id: string
  name: string
  maxHp: number
  emoji: string
}
