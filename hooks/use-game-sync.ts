"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { GameCell, GameConfig, SceneCard } from "@/lib/game-data"

export interface SyncState {
  player1Position: number
  player2Position: number
  currentPlayer: 1 | 2
  skipNextTurn: { player1: boolean; player2: boolean }
  canRollAgain: boolean
  winner: number | null
  cells: GameCell[]
  endpointCells: GameCell[]
  isRolling?: boolean
  timerSeconds?: number
  timerRunning?: boolean
  timerDuration?: number
  player1Gender?: "male" | "female"
  player2Gender?: "male" | "female"
  taskChangedCells?: { [cellIndex: number]: boolean }
  player2Joined?: boolean
  config?: GameConfig
  drawnSceneCards?: SceneCard[]
  sceneCardsDrawn?: boolean
  nextPlayerNumber?: number
}

export function useGameSync(roomId: string | null, enabled: boolean) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [remoteState, setRemoteState] = useState<SyncState | null>(null)
  const lastUpdateRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 获取远程状态
  const fetchState = useCallback(async () => {
    if (!roomId || !enabled) return

    try {
      setIsSyncing(true)
      const res = await fetch(`/api/game-sync?roomId=${roomId}&lastUpdate=${lastUpdateRef.current}`)

      if (!res.ok) {
        setIsConnected(false)
        return
      }

      const data = await res.json()
      setIsConnected(true)

      if (data.updated && data.state) {
        lastUpdateRef.current = data.state.lastUpdate
        setRemoteState({ ...data.state })
      }
    } catch {
      setIsConnected(false)
    } finally {
      setIsSyncing(false)
    }
  }, [roomId, enabled])

  // 推送本地状态
  const pushState = useCallback(
    async (state: SyncState) => {
      if (!roomId || !enabled) return

      try {
        setIsSyncing(true)
        const res = await fetch("/api/game-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, state }),
        })

        if (res.ok) {
          const data = await res.json()
          lastUpdateRef.current = data.lastUpdate
          setIsConnected(true)
        } else {
          setIsConnected(false)
        }
      } catch {
        setIsConnected(false)
      } finally {
        setIsSyncing(false)
      }
    },
    [roomId, enabled],
  )

  const fetchStateImmediately = useCallback(async () => {
    if (!roomId || !enabled) return null

    try {
      const res = await fetch(`/api/game-sync?roomId=${roomId}&lastUpdate=0`)
      if (!res.ok) return null
      const data = await res.json()
      if (data.state) {
        lastUpdateRef.current = data.state.lastUpdate
        setRemoteState({ ...data.state })
        return data.state
      }
    } catch {
      return null
    }
    return null
  }, [roomId, enabled])

  useEffect(() => {
    if (!roomId || !enabled) return

    // 立即获取一次
    fetchState()

    intervalRef.current = setInterval(fetchState, 500)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [roomId, enabled, fetchState])

  return {
    isSyncing,
    isConnected,
    remoteState,
    pushState,
    setRemoteState,
    fetchStateImmediately,
  }
}
