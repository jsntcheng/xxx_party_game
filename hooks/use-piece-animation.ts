"use client"

import { useEffect, useState } from "react"
import type { GameState } from "@/lib/game/types"

/** 骰子转动时长，与 .dice-cube 的 transition 对齐。 */
const DICE_ROLL_MS = 850
const STEP_MS = 230
/** 超过这个距离直接跳过去，避免长时间动画。 */
const MAX_STEP_DISTANCE = 12

type Positions = [number, number]

const positionsOf = (state: GameState): Positions => [state.players[0].position, state.players[1].position]

/**
 * 把状态里的棋子位置变成「可看的」动画位置：
 * 新掷骰先等骰子转完，再一格一格走；效果造成的移动同样逐格走，距离太远直接跳。
 */
export function usePieceAnimation(state: GameState) {
  const targets = positionsOf(state)
  const rollId = state.lastRoll?.id ?? null
  const [shown, setShown] = useState<Positions>(targets)
  const [settledRollId, setSettledRollId] = useState(rollId)
  const [gameId, setGameId] = useState(state.gameId)

  // 换局时直接归位（渲染期同步调整，避免闪一帧旧位置）
  if (gameId !== state.gameId) {
    setGameId(state.gameId)
    setShown(targets)
    setSettledRollId(rollId)
  }

  const rolling = rollId !== null && rollId !== settledRollId
  const [target0, target1] = targets
  const arrived = shown[0] === target0 && shown[1] === target1

  useEffect(() => {
    if (!rolling) return
    const timer = setTimeout(() => setSettledRollId(rollId), DICE_ROLL_MS)
    return () => clearTimeout(timer)
  }, [rolling, rollId])

  useEffect(() => {
    if (rolling || arrived) return
    const timer = setTimeout(() => {
      setShown((prev) => {
        const step = (from: number, to: number) => {
          if (from === to) return from
          if (Math.abs(to - from) > MAX_STEP_DISTANCE) return to
          return from + Math.sign(to - from)
        }
        return [step(prev[0], target0), step(prev[1], target1)]
      })
    }, STEP_MS)
    return () => clearTimeout(timer)
  }, [rolling, arrived, shown, target0, target1])

  return { positions: shown, rolling, moving: rolling || !arrived }
}
