"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "@/components/ui/toast"
import type { SeatStatus } from "@/lib/api-types"
import type { GameController } from "@/lib/client/controller"
import { storage } from "@/lib/client/storage"
import { secureRng } from "@/lib/game/board"
import { applyAction, RuleError } from "@/lib/game/engine"
import type { GameAction, GameSnapshot } from "@/lib/game/types"

const BOTH_PRESENT: [SeatStatus, SeatStatus] = [
  { taken: true, online: true },
  { taken: true, online: true },
]

/** 同屏模式：在浏览器里直接跑规则引擎，状态存 localStorage。 */
export function useLocalGame(initial: GameSnapshot, onLeave: () => void): GameController {
  const [snapshot, setSnapshot] = useState(initial)
  const current = useRef(initial)

  useEffect(() => storage.setLocalGame(snapshot), [snapshot])

  const dispatch = useCallback(async (action: GameAction) => {
    try {
      const next = applyAction(current.current, action, { actor: null, rng: secureRng, now: Date.now() })
      current.current = next
      setSnapshot(next)
      return true
    } catch (error) {
      if (!(error instanceof RuleError)) console.error("[local] 操作失败", error)
      toast(error instanceof Error ? error.message : "操作失败", "error")
      return false
    }
  }, [])

  return useMemo(
    () => ({
      mode: "local",
      roomId: null,
      config: snapshot.config,
      state: snapshot.state,
      mySeat: null,
      seats: BOTH_PRESENT,
      connected: true,
      busy: false,
      now: Date.now,
      dispatch,
      leave: onLeave,
    }),
    [snapshot, dispatch, onLeave],
  )
}
