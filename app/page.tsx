"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { GameBoard } from "@/components/game-board"
import { Dice } from "@/components/dice"
import { PlayerPanel } from "@/components/player-panel"
import { TaskModal } from "@/components/task-modal"
import { ConfigModal } from "@/components/config-modal"
import { WinnerModal } from "@/components/winner-modal"
import { RoomManager } from "@/components/room-manager"
import { SyncIndicator } from "@/components/sync-indicator"
import { GameTimer } from "@/components/game-timer"
import { SceneCardDraw } from "@/components/scene-card-draw"
import { SceneCardViewer } from "@/components/scene-card-viewer"
import {
  type GameConfig,
  type GameCell,
  generateBoard,
  defaultGameConfig,
  shuffleArray,
  type GenderType,
  type SceneCard,
  defaultSceneCardPoolNames,
  defaultSceneCards,
} from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { Heart, RotateCcw, Settings, Layers } from "lucide-react"
import { useGameSync, type SyncState } from "@/hooks/use-game-sync"
import { Loader2 } from "lucide-react" // Import Loader2

export default function GamePage() {
  const [config, setConfig] = useState<GameConfig>(defaultGameConfig)
  const [cells, setCells] = useState<GameCell[]>([])
  const [endpointCells, setEndpointCells] = useState<GameCell[]>([])

  const [player1Position, setPlayer1Position] = useState(0)
  const [player2Position, setPlayer2Position] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1)
  // 骰子值状态
  const [diceValue, setDiceValue] = useState(1)
  const [currentTask, setCurrentTask] = useState<GameCell | null>(null)
  // 获胜者状态类型
  const [winner, setWinner] = useState<1 | 2 | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [isRolling, setIsRolling] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [skipNextTurn, setSkipNextTurn] = useState<{ player1: boolean; player2: boolean }>({
    player1: false,
    player2: false,
  })
  const [canRollAgain, setCanRollAgain] = useState(false)
  const [previewCell, setPreviewCell] = useState<{ cell: GameCell; index: number } | null>(null)

  const [syncEnabled, setSyncEnabled] = useState<boolean | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [isWaitingForPlayer2, setIsWaitingForPlayer2] = useState(false)
  const [player2Joined, setPlayer2Joined] = useState(false)
  const [isHost, setIsHost] = useState(false)
  // myPlayerNumber
  const [myPlayerNumber, setMyPlayerNumber] = useState<1 | 2 | null>(null)

  const [player1Gender, setPlayer1Gender] = useState<GenderType>("male")
  const [player2Gender, setPlayer2Gender] = useState<GenderType>("female")

  const [timerSeconds, setTimerSeconds] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDuration, setTimerDuration] = useState(60)

  const [taskChangedCells, setTaskChangedCells] = useState<{ [cellIndex: number]: boolean }>({})

  const [drawnSceneCards, setDrawnSceneCards] = useState<SceneCard[]>([])
  const [showSceneCardDraw, setShowSceneCardDraw] = useState(false)
  const [showSceneCardViewer, setShowSceneCardViewer] = useState(false)
  const [sceneCardsDrawn, setSceneCardsDrawn] = useState(false)

  const isLocalUpdateRef = useRef(false)

  const { isSyncing, isConnected, remoteState, pushState, setRemoteState, fetchStateImmediately } = useGameSync(
    roomId,
    !!roomId && gameStarted,
  )

  const totalCells = config.boardSize + 2

  useEffect(() => {
    async function checkSync() {
      try {
        const res = await fetch("/api/sync-status")
        const data = await res.json()
        setSyncEnabled(data.syncEnabled)

        if (!data.syncEnabled) {
          setGameStarted(true)
        }
      } catch {
        setSyncEnabled(false)
        setGameStarted(true)
      }
    }
    checkSync()
  }, [])

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/game-config")
      if (response.ok) {
        const savedConfig = await response.json()
        setConfig(savedConfig)
        return savedConfig
      }
    } catch (error) {
      console.error("加载配置失败:", error)
    }
    return defaultGameConfig
  }, [])

  const initGame = useCallback((gameConfig: GameConfig) => {
    const board = generateBoard(gameConfig)
    setCells(board)
    setEndpointCells(shuffleArray([...gameConfig.endpointCells]))
    setPlayer1Position(0)
    setPlayer2Position(0)
    setCurrentPlayer(1)
    setWinner(null)
    setCurrentTask(null)
    // currentTaskIndex no longer needed
    // setCurrentTaskIndex(null)
    setSkipNextTurn({ player1: false, player2: false })
    setCanRollAgain(false)
    setIsLoading(false)
    setTaskChangedCells({})
    // Reset scene card states
    setDrawnSceneCards([])
    setSceneCardsDrawn(false)
  }, [])

  useEffect(() => {
    loadConfig().then(initGame)
  }, [loadConfig, initGame])

  // Generate board and shuffle endpoint cells when config changes
  // useEffect(() => {
  //   const newBoard = generateBoard(config)
  //   setCells(newBoard)
  //   const shuffledEndpoint = shuffleArray([...config.endpointCells])
  //   setEndpointCells(shuffledEndpoint)
  // }, [config])

  useEffect(() => {
    if (remoteState) {
      // Always apply remote state - server is the source of truth
      setPlayer1Position(remoteState.player1Position ?? player1Position)
      setPlayer2Position(remoteState.player2Position ?? player2Position)
      setCurrentPlayer(remoteState.currentPlayer ?? currentPlayer)
      setSkipNextTurn(remoteState.skipNextTurn ?? skipNextTurn)
      setCanRollAgain(remoteState.canRollAgain ?? canRollAgain)
      setWinner(remoteState.winner ?? winner)
      if (remoteState.cells && remoteState.cells.length > 0) setCells(remoteState.cells)
      if (remoteState.endpointCells && remoteState.endpointCells.length > 0) setEndpointCells(remoteState.endpointCells)
      if (remoteState.timerSeconds !== undefined) setTimerSeconds(remoteState.timerSeconds)
      if (remoteState.timerRunning !== undefined) setTimerRunning(remoteState.timerRunning)
      if (remoteState.timerDuration !== undefined) setTimerDuration(remoteState.timerDuration)
      if (remoteState.player1Gender) setPlayer1Gender(remoteState.player1Gender)
      if (remoteState.player2Gender) setPlayer2Gender(remoteState.player2Gender)
      if (remoteState.taskChangedCells) setTaskChangedCells(remoteState.taskChangedCells)
      if (remoteState.player2Joined !== undefined) setPlayer2Joined(remoteState.player2Joined)
      if (remoteState.config) {
        setConfig(remoteState.config)
      }
      if (remoteState.drawnSceneCards) setDrawnSceneCards(remoteState.drawnSceneCards)
      if (remoteState.sceneCardsDrawn !== undefined) setSceneCardsDrawn(remoteState.sceneCardsDrawn)
    }
  }, [remoteState])

  const syncStateWithOverrides = useCallback(
    (overrides: Partial<SyncState> = {}) => {
      if (!roomId || !gameStarted) return

      // Remove isRolling from overrides if present
      const { isRolling: _isRolling, ...cleanOverrides } = overrides as any

      const finalState: SyncState = {
        player1Position: overrides.player1Position ?? player1Position,
        player2Position: overrides.player2Position ?? player2Position,
        currentPlayer: overrides.currentPlayer ?? currentPlayer,
        skipNextTurn: overrides.skipNextTurn ?? skipNextTurn,
        canRollAgain: overrides.canRollAgain ?? canRollAgain,
        winner: overrides.winner ?? winner,
        cells: overrides.cells ?? cells,
        endpointCells: overrides.endpointCells ?? endpointCells,
        timerSeconds: overrides.timerSeconds ?? timerSeconds,
        timerRunning: overrides.timerRunning ?? timerRunning,
        timerDuration: overrides.timerDuration ?? timerDuration,
        player1Gender: overrides.player1Gender ?? player1Gender,
        player2Gender: overrides.player2Gender ?? player2Gender,
        taskChangedCells: overrides.taskChangedCells ?? taskChangedCells,
        player2Joined: overrides.player2Joined ?? player2Joined,
        config: overrides.config ?? config,
        drawnSceneCards: overrides.drawnSceneCards ?? drawnSceneCards,
        sceneCardsDrawn: overrides.sceneCardsDrawn ?? sceneCardsDrawn,
      }

      pushState(finalState)
    },
    [
      roomId,
      gameStarted,
      player1Position,
      player2Position,
      currentPlayer,
      skipNextTurn,
      canRollAgain,
      winner,
      cells,
      endpointCells,
      timerSeconds,
      timerRunning,
      timerDuration,
      player1Gender,
      player2Gender,
      taskChangedCells,
      player2Joined,
      config,
      drawnSceneCards,
      sceneCardsDrawn,
      pushState,
    ],
  )

  const syncState = useCallback(() => {
    syncStateWithOverrides({})
  }, [syncStateWithOverrides])

  const drawSceneCards = useCallback(() => {
    const poolNames = config.sceneCardPoolNames || defaultSceneCardPoolNames
    const cards = config.sceneCards || defaultSceneCards
    const count = config.sceneCardCount ?? 3

    if (count === 0 || poolNames.length === 0) {
      setSceneCardsDrawn(true)
      return
    }

    // 从前N个卡池各抽一张
    const drawn: SceneCard[] = []
    for (let i = 0; i < Math.min(count, poolNames.length); i++) {
      const poolName = poolNames[i]
      const poolCards = cards.filter((c) => c.pool === poolName)
      if (poolCards.length > 0) {
        const shuffled = shuffleArray([...poolCards])
        drawn.push(shuffled[0])
      }
    }

    if (drawn.length === 0) {
      setSceneCardsDrawn(true)
      return
    }

    setDrawnSceneCards(drawn)
    setShowSceneCardDraw(true)
  }, [config.sceneCardPoolNames, config.sceneCards, config.sceneCardCount])

  const handleSceneCardDrawComplete = useCallback(() => {
    setShowSceneCardDraw(false)
    setSceneCardsDrawn(true)
    if (roomId) {
      syncStateWithOverrides({
        drawnSceneCards,
        sceneCardsDrawn: true,
      })
    }
  }, [roomId, drawnSceneCards, syncStateWithOverrides])

  const handleCreateRoom = async (selectedGender: "male" | "female"): Promise<string | null> => {
    try {
      const p1Gender = selectedGender
      const p2Gender = selectedGender === "male" ? "female" : "male"

      setPlayer1Gender(p1Gender)
      setPlayer2Gender(p2Gender)
      setIsHost(true)
      setMyPlayerNumber(1)

      const poolNames = config.sceneCardPoolNames || defaultSceneCardPoolNames
      const cards = config.sceneCards || defaultSceneCards
      const count = config.sceneCardCount ?? 3
      const drawn: SceneCard[] = []

      for (let i = 0; i < Math.min(count, poolNames.length); i++) {
        const poolName = poolNames[i]
        const poolCards = cards.filter((c) => c.pool === poolName)
        if (poolCards.length > 0) {
          const shuffled = shuffleArray([...poolCards])
          drawn.push(shuffled[0])
        }
      }

      setDrawnSceneCards(drawn)

      const state: SyncState = {
        player1Position: 0,
        player2Position: 0,
        currentPlayer: 1,
        skipNextTurn: { player1: false, player2: false },
        canRollAgain: false,
        winner: null,
        cells,
        endpointCells,
        isRolling: false,
        timerSeconds: 60,
        timerRunning: false,
        timerDuration: 60,
        player1Gender: p1Gender,
        player2Gender: p2Gender,
        taskChangedCells: {},
        player2Joined: false,
        config: config,
        nextPlayerNumber: 2,
        drawnSceneCards: drawn,
        sceneCardsDrawn: false,
      }

      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      })

      if (res.ok) {
        const data = await res.json()
        setRoomId(data.roomId)
        setGameStarted(true)
        setIsWaitingForPlayer2(true)
        setPlayer2Joined(false)
        return data.roomId
      }
    } catch (error) {
      console.error("创建房间失败:", error)
    }
    return null
  }

  const handleJoinRoom = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/room?roomId=${id}`)
      const data = await res.json()

      if (data.exists && data.state) {
        const state = data.state

        // Assign player number based on nextPlayerNumber
        const assignedPlayerNumber = state.nextPlayerNumber || 2
        setMyPlayerNumber(assignedPlayerNumber as 1 | 2)

        const newNextPlayerNumber = assignedPlayerNumber === 1 ? 2 : 1

        setRoomId(id.toUpperCase())
        setRemoteState(data.state)
        setPlayer1Position(data.state.player1Position)
        setPlayer2Position(data.state.player2Position)
        setCurrentPlayer(data.state.currentPlayer)
        setSkipNextTurn(data.state.skipNextTurn)
        setCanRollAgain(data.state.canRollAgain)
        setWinner(data.state.winner)
        if (data.state.cells.length > 0) setCells(data.state.cells)
        if (data.state.endpointCells.length > 0) setEndpointCells(data.state.endpointCells)
        if (data.state.player1Gender) setPlayer1Gender(data.state.player1Gender)
        if (data.state.player2Gender) setPlayer2Gender(data.state.player2Gender)
        if (data.state.timerSeconds !== undefined) setTimerSeconds(data.state.timerSeconds)
        if (data.state.timerRunning !== undefined) setTimerRunning(data.state.timerRunning)
        if (data.state.timerDuration !== undefined) setTimerDuration(data.state.timerDuration)
        if (data.state.taskChangedCells) setTaskChangedCells(data.state.taskChangedCells)
        if (data.state.config) {
          setConfig(data.state.config)
        }
        if (data.state.drawnSceneCards) setDrawnSceneCards(data.state.drawnSceneCards)
        if (data.state.sceneCardsDrawn !== undefined) setSceneCardsDrawn(data.state.sceneCardsDrawn)

        setGameStarted(true)
        setPlayer2Joined(true)
        setIsWaitingForPlayer2(false)
        setIsHost(false)

        // 通知房主玩家2已加入
        const updatedState: SyncState = {
          ...data.state,
          player2Joined: true,
          nextPlayerNumber: newNextPlayerNumber, // Update next player number
        }
        await fetch("/api/game-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: id.toUpperCase(), state: updatedState }),
        })

        return true
      }
    } catch (error) {
      console.error("加入房间失败:", error)
    }
    return false
  }

  const handleCheckPlayer2Joined = async (): Promise<boolean> => {
    if (!roomId) return false
    try {
      const res = await fetch(`/api/room?roomId=${roomId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.state?.player2Joined) {
          setPlayer2Joined(true)
          setIsWaitingForPlayer2(false)
          if (!sceneCardsDrawn && drawnSceneCards.length > 0) {
            setShowSceneCardDraw(true)
          }
          return true
        }
      }
    } catch (error) {
      console.error("检查玩家2状态失败:", error)
    }
    return false
  }

  const handlePlayLocal = () => {
    setSyncEnabled(false)
    setGameStarted(true)
    setMyPlayerNumber(null)
    drawSceneCards()
  }

  useEffect(() => {
    if (player2Joined && !sceneCardsDrawn && drawnSceneCards.length > 0 && !showSceneCardDraw) {
      setShowSceneCardDraw(true)
    }
  }, [player2Joined, sceneCardsDrawn, drawnSceneCards, showSceneCardDraw])

  const getCellContent = useCallback(
    (index: number): GameCell | null => {
      if (index === 0 || index >= totalCells - 1) return null

      const endpointZoneStart = cells.length + 1
      if (index >= endpointZoneStart) {
        const endpointIndex = index - endpointZoneStart
        if (endpointIndex < endpointCells.length) {
          return endpointCells[endpointIndex]
        }
      }

      const cellIndex = index - 1
      if (cellIndex >= 0 && cellIndex < cells.length) {
        return cells[cellIndex]
      }

      return null
    },
    [cells, endpointCells, totalCells],
  )

  const getCurrentPlayerGender = useCallback(() => {
    return currentPlayer === 1 ? player1Gender : player2Gender
  }, [currentPlayer, player1Gender, player2Gender])

  const handleTimerChange = useCallback(
    (seconds: number, running: boolean, duration: number) => {
      setTimerSeconds(seconds)
      setTimerRunning(running)
      setTimerDuration(duration)
      // Sync immediately when timer changes
      if (roomId && gameStarted) {
        const state: SyncState = {
          player1Position,
          player2Position,
          currentPlayer,
          skipNextTurn,
          canRollAgain,
          winner,
          cells,
          endpointCells,
          timerSeconds: seconds,
          timerRunning: running,
          timerDuration: duration,
          player1Gender,
          player2Gender,
          taskChangedCells,
          player2Joined,
          config: config,
        }
        pushState(state)
      }
    },
    [
      roomId,
      gameStarted,
      player1Position,
      player2Position,
      currentPlayer,
      skipNextTurn,
      canRollAgain,
      winner,
      cells,
      endpointCells,
      player1Gender,
      player2Gender,
      taskChangedCells,
      player2Joined,
      config,
      pushState,
    ],
  )

  const handleTaskChange = useCallback(
    (cellId: number, newTask: GameCell) => {
      setCurrentTask(newTask)
      const newTaskChangedCells = { ...taskChangedCells, [cellId]: true }
      setTaskChangedCells(newTaskChangedCells)
      if (roomId) {
        syncStateWithOverrides({ taskChangedCells: newTaskChangedCells })
      }
    },
    [taskChangedCells, roomId, syncStateWithOverrides],
  )

  const handleDiceRoll = useCallback(
    (value: number) => {
      if (isRolling || winner) return

      setIsRolling(true)
      const currentPos = currentPlayer === 1 ? player1Position : player2Position
      const newPos = Math.min(currentPos + value, totalCells - 1)

      const updatePosition = currentPlayer === 1 ? setPlayer1Position : setPlayer2Position
      updatePosition(newPos)

      setDiceValue(value)

      setTimeout(() => {
        // Check for winner
        if (newPos >= totalCells - 1) {
          setWinner(currentPlayer)
          setIsRolling(false)
          syncStateWithOverrides({ isRolling: false })
          return
        }

        // Use current player gender to get appropriate task
        const currentGender = currentPlayer === 1 ? player1Gender : player2Gender
        const task = getCellContent(newPos)

        if (task && !winner) {
          // Handle effects
          if (task.effect) {
            if (task.effect.type === "move" && task.effect.value) {
              if (task.effect.value === -999) {
                updatePosition(1)
              } else {
                const effectPos = Math.max(1, Math.min(newPos + task.effect.value, totalCells - 1))
                updatePosition(effectPos)
              }
            } else if (task.effect.type === "swap") {
              const otherPos = currentPlayer === 1 ? player2Position : player1Position
              updatePosition(otherPos)
              if (currentPlayer === 1) {
                setPlayer2Position(newPos)
              } else {
                setPlayer1Position(newPos)
              }
            }
          }

          setCurrentTask(task)
          syncStateWithOverrides({ isRolling: true })
        } else {
          // No task, switch player
          setIsRolling(false)
          const newCurrentPlayer = currentPlayer === 1 ? 2 : 1
          setCurrentPlayer(newCurrentPlayer)
          syncStateWithOverrides({
            currentPlayer: newCurrentPlayer,
            isRolling: false,
          })
        }
      }, 500)
    },
    [
      isRolling,
      winner,
      currentPlayer,
      player1Position,
      player2Position,
      totalCells,
      getCellContent,
      syncStateWithOverrides,
      player1Gender,
      player2Gender,
    ],
  )

  const handleTaskComplete = (effect?: GameCell["effect"]) => {
    setCurrentTask(null)
    // currentTaskIndex no longer needed
    // setCurrentTaskIndex(null)
    setIsRolling(false)

    let newPlayer1Position = player1Position
    let newPlayer2Position = player2Position
    let shouldRollAgain = false

    if (effect) {
      const currentPos = currentPlayer === 1 ? player1Position : player2Position

      switch (effect.type) {
        case "move":
          if (effect.value) {
            let newPos = effect.value === -999 ? 0 : currentPos + effect.value
            newPos = Math.max(0, Math.min(newPos, totalCells - 1))
            if (currentPlayer === 1) {
              setPlayer1Position(newPos)
              newPlayer1Position = newPos
            } else {
              setPlayer2Position(newPos)
              newPlayer2Position = newPos
            }
          }
          break
        case "skip":
          const skipKey = currentPlayer === 1 ? "player1" : "player2"
          setSkipNextTurn((prev) => ({ ...prev, [skipKey]: true }))
          break
        case "again":
          setCanRollAgain(true)
          setIsRolling(false)
          shouldRollAgain = true
          setTimeout(
            () =>
              syncStateWithOverrides({
                canRollAgain: true,
                isRolling: false,
              }),
            100,
          )
          return
        case "swap":
          const temp = player1Position
          setPlayer1Position(player2Position)
          setPlayer2Position(temp)
          newPlayer1Position = player2Position
          newPlayer2Position = temp
          break
      }
    }

    if (!winner && !canRollAgain && !shouldRollAgain) {
      const newCurrentPlayer = currentPlayer === 1 ? 2 : 1
      setCurrentPlayer(newCurrentPlayer)
      setIsRolling(false)
      setTimeout(
        () =>
          syncStateWithOverrides({
            currentPlayer: newCurrentPlayer,
            player1Position: newPlayer1Position,
            player2Position: newPlayer2Position,
          }),
        100,
      )
    } else {
      setIsRolling(false)
      setTimeout(
        () =>
          syncStateWithOverrides({
            player1Position: newPlayer1Position,
            player2Position: newPlayer2Position,
          }),
        100,
      )
    }
  }

  const handleRestart = () => {
    initGame(config)
    // Reset scene card states and re-sync if in a room
    const newBoard = generateBoard(config)
    setCells(newBoard)
    const shuffledEndpoint = shuffleArray([...config.endpointCells])
    setEndpointCells(shuffledEndpoint)
    setPlayer1Position(0)
    setPlayer2Position(0)
    setCurrentPlayer(1)
    setDiceValue(1)
    setWinner(null)
    setSkipNextTurn({ player1: false, player2: false })
    setCanRollAgain(false)
    setTaskChangedCells({})
    // Reset scene card states
    setDrawnSceneCards([])
    setSceneCardsDrawn(false)

    if (roomId) {
      // Re-draw scene cards for the new game
      const poolNames = config.sceneCardPoolNames || defaultSceneCardPoolNames
      const cards = config.sceneCards || defaultSceneCards
      const count = config.sceneCardCount ?? 3
      const drawn: SceneCard[] = []

      for (let i = 0; i < Math.min(count, poolNames.length); i++) {
        const poolName = poolNames[i]
        const poolCards = cards.filter((c) => c.pool === poolName)
        if (poolCards.length > 0) {
          const shuffled = shuffleArray([...poolCards])
          drawn.push(shuffled[0])
        }
      }

      setDrawnSceneCards(drawn)

      syncStateWithOverrides({
        player1Position: 0,
        player2Position: 0,
        currentPlayer: 1,
        skipNextTurn: { player1: false, player2: false },
        canRollAgain: false,
        winner: null,
        cells: newBoard,
        endpointCells: shuffledEndpoint,
        taskChangedCells: {},
        drawnSceneCards: drawn,
        sceneCardsDrawn: false,
      })

      // Show scene card draw animation after restart
      if (drawn.length > 0) {
        setShowSceneCardDraw(true)
      }
    } else {
      // Local mode re-draw
      drawSceneCards()
    }
  }

  const handleConfigSave = (newConfig: GameConfig) => {
    // 限制 boardSize 在有效范围内
    const validatedConfig = {
      ...newConfig,
      boardSize: Math.min(Math.max(newConfig.boardSize, 20), 56),
    }
    setConfig(validatedConfig)
    if (roomId) {
      syncStateWithOverrides({ config: validatedConfig })
    }
  }

  const handleConfigReset = () => {
    setConfig(defaultGameConfig)
    if (roomId) {
      syncStateWithOverrides({ config: defaultGameConfig })
    }
  }

  const canCurrentDeviceRoll = useCallback(() => {
    // Local mode allows rolling anytime
    if (!roomId) return true
    // If player 2 hasn't joined, no one can roll
    if (!player2Joined) return false
    // Online mode: only allow rolling if it's the current player's turn and they are the current device's player number
    if (myPlayerNumber !== null && currentPlayer !== myPlayerNumber) return false
    // If currently rolling, cannot roll again
    if (isRolling) return false
    return true
  }, [roomId, player2Joined, myPlayerNumber, currentPlayer, isRolling])

  const handleCellClick = useCallback(
    (index: number) => {
      const cell = getCellContent(index)
      if (cell && !taskChangedCells[index]) {
        setPreviewCell({ cell, index })
      }
    },
    [getCellContent, taskChangedCells],
  )

  if (syncEnabled === null || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-rose-500 mx-auto mb-4 animate-spin" />
          <p className="text-base md:text-lg text-muted-foreground">加载游戏中...</p>
        </div>
      </div>
    )
  }

  // Waiting for room or game not started
  if (syncEnabled && (!gameStarted || (isWaitingForPlayer2 && !player2Joined))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-50 to-pink-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold text-rose-600 text-center mb-6 flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 md:w-8 md:h-8 fill-rose-500" />
            <span className="hidden sm:inline">情侣飞行棋</span>
          </h1>
          <RoomManager
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onPlayLocal={handlePlayLocal}
            waitingRoomId={roomId}
            isWaitingForPlayer2={isWaitingForPlayer2}
            onCheckPlayer2Joined={handleCheckPlayer2Joined}
          />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-50 to-pink-100 p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <h1 className="text-lg md:text-2xl font-bold text-rose-600 flex items-center gap-1 md:gap-2">
            <Heart className="w-4 h-4 md:w-6 md:h-6 fill-rose-500" />
            <span className="hidden sm:inline">情侣飞行棋</span>
          </h1>

          <div className="flex items-center gap-2">
            {roomId && <SyncIndicator roomId={roomId} isSyncing={isSyncing} isConnected={isConnected} />}
            {drawnSceneCards.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSceneCardViewer(true)}
                className="bg-white/80 text-xs md:text-sm h-8 px-2 md:px-3"
              >
                <Layers className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">场景卡</span>
                <span className="sm:hidden">🎴</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(true)}
              className="bg-white/80 text-xs md:text-sm h-8 px-2 md:px-3"
            >
              <Settings className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">自定义</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              className="bg-white/80 text-xs md:text-sm h-8 px-2 md:px-3"
            >
              <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">重新开始</span>
            </Button>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_280px] gap-2 md:gap-3">
          {/* Side Panel */}
          <div className="order-1 lg:order-2 space-y-2 md:space-y-3">
            {/* 玩家信息 */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <PlayerPanel
                playerNumber={1}
                name={`玩家1 (${player1Gender === "male" ? "♂" : "♀"})`}
                position={player1Position}
                isCurrentPlayer={currentPlayer === 1}
                totalCells={totalCells}
                isSkipped={skipNextTurn.player1}
              />
              <PlayerPanel
                playerNumber={2}
                name={`玩家2 (${player2Gender === "male" ? "♂" : "♀"})`}
                position={player2Position}
                isCurrentPlayer={currentPlayer === 2}
                totalCells={totalCells}
                isSkipped={skipNextTurn.player2}
              />
            </div>

            {/* 骰子和计时器 */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {/* Dice */}
              <div className="bg-white/90 rounded-xl p-3 md:p-4 text-center shadow-lg">
                <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">
                  {canRollAgain ? (
                    <span className="text-yellow-600 font-bold">可以再掷!</span>
                  ) : (
                    <>
                      {currentPlayer === 1
                        ? player1Gender === "male"
                          ? "♂"
                          : "♀"
                        : player2Gender === "male"
                          ? "♂"
                          : "♀"}{" "}
                      的回合
                    </>
                  )}
                </p>
                <div className="flex justify-center">
                  <Dice onRoll={handleDiceRoll} disabled={!canCurrentDeviceRoll() || !!currentTask || !!winner} />
                </div>
                {roomId && isRolling && <p className="text-xs text-amber-600 mt-2 animate-pulse">投掷中...</p>}
              </div>

              {/* Game Timer with sync */}
              <GameTimer
                syncEnabled={!!roomId}
                syncedSeconds={timerSeconds}
                syncedRunning={timerRunning}
                syncedDuration={timerDuration}
                onTimerChange={handleTimerChange}
              />
            </div>

            {previewCell && (
              <div className="lg:hidden bg-white/80 rounded-lg p-2">
                <div className="grid grid-cols-6 gap-1 text-[9px] text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded bg-blue-400 mb-0.5" />
                    <span>真心话</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded bg-purple-400 mb-0.5" />
                    <span>大冒险</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded bg-pink-400 mb-0.5" />
                    <span>亲亲</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded bg-green-400 mb-0.5" />
                    <span>前进</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded bg-red-400 mb-0.5" />
                    <span>后退</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded bg-yellow-400 mb-0.5" />
                    <span>再掷</span>
                  </div>
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-1">点击格子查看内容</p>
              </div>
            )}

            {/* Game Rules */}
            <div className="hidden lg:block bg-white/70 rounded-xl p-3 text-sm">
              <h3 className="font-bold mb-2 text-rose-600">游戏规则</h3>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>• 双方轮流投掷骰子前进</li>
                <li>• 完成格子上的任务后换对方</li>
                <li>• 不同颜色格子有不同任务类型</li>
                <li>• 普通格子可点击"换一个"换专属任务</li>
                <li>• 先到达终点者获胜</li>
              </ul>
            </div>
          </div>

          {/* Board */}
          <div className="order-2 lg:order-1">
            <GameBoard
              cells={cells}
              endpointCells={endpointCells}
              endpointContent={config.endpointContent}
              player1Position={player1Position}
              player2Position={player2Position}
              currentPlayer={currentPlayer}
              onCellClick={handleCellClick}
            />

            <div className="lg:hidden mt-2 bg-white/80 rounded-lg p-2">
              <div className="grid grid-cols-6 gap-1 text-[9px] text-center">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded bg-blue-400 mb-0.5" />
                  <span>真心话</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded bg-purple-400 mb-0.5" />
                  <span>大冒险</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded bg-pink-400 mb-0.5" />
                  <span>亲亲</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded bg-green-400 mb-0.5" />
                  <span>前进</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded bg-red-400 mb-0.5" />
                  <span>后退</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded bg-yellow-400 mb-0.5" />
                  <span>再掷</span>
                </div>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-1">点击格子查看内容</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Use task prop and pass alternatives */}
      {currentTask && (
        <TaskModal
          cell={currentTask}
          onComplete={handleTaskComplete}
          playerName={currentPlayer === 1 ? "玩家1" : "玩家2"}
          currentPlayerGender={getCurrentPlayerGender()}
          config={config}
          cellIndex={currentPlayer === 1 ? player1Position : player2Position}
          canChangeTask={!taskChangedCells[currentPlayer === 1 ? player1Position : player2Position]}
          onTaskChange={(newCell) => handleTaskChange(currentPlayer === 1 ? player1Position : player2Position, newCell)}
        />
      )}

      {showSceneCardDraw && (
        <SceneCardDraw
          isOpen={showSceneCardDraw}
          onClose={handleSceneCardDrawComplete}
          poolNames={config.sceneCardPoolNames || defaultSceneCardPoolNames}
          drawnCards={drawnSceneCards}
        />
      )}

      <SceneCardViewer
        isOpen={showSceneCardViewer}
        onClose={() => setShowSceneCardViewer(false)}
        cards={drawnSceneCards}
      />

      {showConfig && (
        <ConfigModal
          isOpen={showConfig}
          config={config}
          onSave={handleConfigSave}
          onClose={() => setShowConfig(false)}
          onReset={handleConfigReset}
        />
      )}

      {/* Winner modal winner type */}
      {winner !== null && <WinnerModal winner={winner} onRestart={handleRestart} />}
    </main>
  )
}
