import type { Rng } from "@/lib/game/board"
import type { GameCell, GameConfig, GameSnapshot, PlayerProfile } from "@/lib/game/types"
import { defaultGameConfig } from "@/lib/game/defaults"
import { createGame } from "@/lib/game/engine"

/** 可复现的伪随机源（mulberry32）。 */
export function seededRng(seed = 42): Rng {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 让下一次掷骰得到指定点数的随机源。 */
export const diceRng = (value: number): Rng => () => (value - 1) / 6 + 0.01

/** 依次返回给定的值，用完后一直返回最后一个。 */
export function seqRng(...values: number[]): Rng {
  let index = 0
  return () => values[Math.min(index++, values.length - 1)]
}

export const PLAYERS: [PlayerProfile, PlayerProfile] = [
  { name: "小红", gender: "female" },
  { name: "小明", gender: "male" },
]

export function newSnapshot(config: GameConfig = defaultGameConfig): GameSnapshot {
  return { config, state: createGame(config, PLAYERS, seededRng()) }
}

/** 把某一格替换成指定内容，便于构造确定的场景。 */
export function withCell(snapshot: GameSnapshot, index: number, cell: Omit<GameCell, "id">): GameSnapshot {
  const board = snapshot.state.board.map((c, i) => (i === index ? { ...cell, id: index } : c))
  return { ...snapshot, state: { ...snapshot.state, board } }
}
