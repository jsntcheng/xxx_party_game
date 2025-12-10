"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { GameCell } from "@/lib/game-data"

export interface PlayerState {
  id: string
  name: string
  gender: "male" | "female"
  position: number
  isSkipped: boolean
  seatIndex: number
}

export interface TimerState {
  duration: number
  timeLeft: number
  isRunning: boolean
  startedAt?: number // 计时器启动的时间戳
  pausedAt?: number // 计时器暂停的时间戳
}

export interface SyncState {
  players: PlayerState[]
  currentPlayerIndex: number
  canRollAgain: boolean
  winner: string | null
  cells: GameCell[]
  endpointCells: GameCell[]
  timer: TimerState
  lastUpdate?: number
  version?: number
}

export interface RoomConfig {
  maleCount: number
  femaleCount: number
  totalPlayers: number
  seats: {
    index: number
    gender: "male" | "female"
    playerId: string | null
    playerName: string | null
  }[]
}

export function useGameSync(roomId: string | null, enabled: boolean) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [remoteState, setRemoteState] = useState<SyncState | null>(null)
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null)
  const lastUpdateRef = useRef(0)
  const versionRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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

      if (data.state) {
        const serverVersion = data.state.version || 0
        if (serverVersion > versionRef.current || data.state.lastUpdate > lastUpdateRef.current) {
          lastUpdateRef.current = data.state.lastUpdate
          versionRef.current = serverVersion
          setRemoteState(data.state)
        }
      }
      if (data.roomConfig) {
        setRoomConfig(data.roomConfig)
      }
    } catch {
      setIsConnected(false)
    } finally {
      setIsSyncing(false)
    }
  }, [roomId, enabled])

  const pushState = useCallback(
    async (state: SyncState) => {
      if (!roomId || !enabled) return

      try {
        setIsSyncing(true)
        const newVersion = versionRef.current + 1
        const stateWithVersion = { ...state, version: newVersion }

        const res = await fetch("/api/game-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, state: stateWithVersion }),
        })

        if (res.ok) {
          const data = await res.json()
          lastUpdateRef.current = data.lastUpdate
          versionRef.current = newVersion
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

  const updateSeat = useCallback(
    async (seatIndex: number, playerId: string, playerName: string) => {
      if (!roomId || !enabled) return false

      try {
        const res = await fetch("/api/room", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, seatIndex, playerId, playerName }),
        })
        if (res.ok) {
          const data = await res.json()
          setRoomConfig(data.roomConfig)
          return true
        }
      } catch (error) {
        console.error("更新座位失败:", error)
      }
      return false
    },
    [roomId, enabled],
  )

  useEffect(() => {
    if (!roomId || !enabled) return

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
    roomConfig,
    pushState,
    updateSeat,
    setRemoteState,
    setRoomConfig,
    fetchState,
  }
}
