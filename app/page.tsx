"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { GameBoard } from "@/components/game-board"
import { Dice } from "@/components/dice"
import { PlayerPanel } from "@/components/player-panel"
import { TaskModal } from "@/components/task-modal"
import { ConfigModal } from "@/components/config-modal"
import { WinnerModal } from "@/components/winner-modal"
import { GameTimer, type TimerState } from "@/components/game-timer"
import { RoomManager } from "@/components/room-manager"
import { SyncIndicator } from "@/components/sync-indicator"
import { useGameSync, type SyncState, type PlayerState } from "@/hooks/use-game-sync"
import {
  type GameCell,
  type GameConfig,
  defaultGameConfig,
  shuffleArray,
  generateBoard,
  getCellContentForPlayer,
} from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { Settings, RotateCcw, Heart, Loader2 } from "lucide-react"

export default function GamePage() {
  const [config, setConfig] = useState<GameConfig>(defaultGameConfig)
  const [cells, setCells] = useState<GameCell[]>([])
  const [endpointCells, setEndpointCells] = useState<GameCell[]>([])

  // 多玩家状态
  const [players, setPlayers] = useState<PlayerState[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentTask, setCurrentTask] = useState<GameCell | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [canRollAgain, setCanRollAgain] = useState(false)
  const [previewCell, setPreviewCell] = useState<{ cell: GameCell; index: number } | null>(null)
  const [timerState, setTimerState] = useState<TimerState>({ duration: 60, timeLeft: 60, isRunning: false })

  const [syncEnabled, setSyncEnabled] = useState<boolean | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [playerId] = useState(() => `player_${Math.random().toString(36).substring(2, 10)}`)
  const [playerName, setPlayerName] = useState("")
  const [mySeatIndex, setMySeatIndex] = useState<number | null>(null)
  const isLocalUpdateRef = useRef(false)

  const { isSyncing, isConnected, remoteState, roomConfig, pushState, updateSeat, setRemoteState, setRoomConfig } =
    useGameSync(roomId, !!roomId && gameStarted)

  const totalCells = cells.length + endpointCells.length + 2

  const isMyTurn = useMemo(() => {
    if (!roomId || !gameStarted) return true // 本地模式始终可以操作
    if (players.length === 0) return false
    const currentPlayer = players[currentPlayerIndex]
    if (!currentPlayer) return false
    return currentPlayer.id === playerId
  }, [roomId, gameStarted, players, currentPlayerIndex, playerId])

  const currentPlayerGender = useMemo(() => {
    if (players.length === 0) return undefined
    return players[currentPlayerIndex]?.gender
  }, [players, currentPlayerIndex])

  // 检查同步是否可用
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

  // 加载配置
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

  // 初始化本地游戏
  const initLocalGame = useCallback((gameConfig: GameConfig) => {
    const board = generateBoard(gameConfig)
    setCells(board)
    setEndpointCells(shuffleArray([...gameConfig.endpointCells]))

    // 本地模式默认两人
    setPlayers([
      { id: "local_1", name: "玩家1", gender: "male", position: 0, isSkipped: false, seatIndex: 0 },
      { id: "local_2", name: "玩家2", gender: "female", position: 0, isSkipped: false, seatIndex: 1 },
    ])
    setCurrentPlayerIndex(0)
    setWinner(null)
    setCurrentTask(null)
    setCanRollAgain(false)
    setIsLoading(false)
  }, [])

  // 初始加载
  useEffect(() => {
    loadConfig().then(initLocalGame)
  }, [loadConfig, initLocalGame])

  useEffect(() => {
    if (remoteState && !isLocalUpdateRef.current) {
      // 立即更新关键游戏状态
      if (remoteState.players?.length > 0) setPlayers(remoteState.players)
      setCurrentPlayerIndex(remoteState.currentPlayerIndex)
      setCanRollAgain(remoteState.canRollAgain)
      setWinner(remoteState.winner)
      if (remoteState.cells?.length > 0) setCells(remoteState.cells)
      if (remoteState.endpointCells?.length > 0) setEndpointCells(remoteState.endpointCells)
      if (remoteState.timer) setTimerState(remoteState.timer)
    }
    isLocalUpdateRef.current = false
  }, [remoteState])

  // 检查是否所有座位已满并开始游戏
  useEffect(() => {
    if (roomConfig && roomId && gameStarted) {
      const allSeated = roomConfig.seats.every((s) => s.playerId !== null)
      if (allSeated && players.length === 0) {
        // 根据座位生成玩家列表
        const newPlayers: PlayerState[] = roomConfig.seats.map((seat) => ({
          id: seat.playerId!,
          name: seat.playerName || `玩家${seat.index + 1}`,
          gender: seat.gender,
          position: 0,
          isSkipped: false,
          seatIndex: seat.index,
        }))
        setPlayers(newPlayers)

        // 同步到服务器
        const state: SyncState = {
          players: newPlayers,
          currentPlayerIndex: 0,
          canRollAgain: false,
          winner: null,
          cells,
          endpointCells,
          timer: timerState,
          version: 1,
        }
        pushState(state)
      }
    }
  }, [roomConfig, roomId, gameStarted, players.length, cells, endpointCells, timerState, pushState])

  const syncState = useCallback(() => {
    if (!roomId || !gameStarted) return

    isLocalUpdateRef.current = true
    const state: SyncState = {
      players,
      currentPlayerIndex,
      canRollAgain,
      winner,
      cells,
      endpointCells,
      timer: timerState,
    }
    pushState(state)
  }, [
    roomId,
    gameStarted,
    players,
    currentPlayerIndex,
    canRollAgain,
    winner,
    cells,
    endpointCells,
    timerState,
    pushState,
  ])

  // 创建房间
  const handleCreateRoom = async (roomCfg: { maleCount: number; femaleCount: number }): Promise<string | null> => {
    try {
      const board = generateBoard(config)
      const epCells = shuffleArray([...config.endpointCells])

      const state: SyncState = {
        players: [],
        currentPlayerIndex: 0,
        canRollAgain: false,
        winner: null,
        cells: board,
        endpointCells: epCells,
        timer: { duration: 60, timeLeft: 60, isRunning: false },
        version: 0,
      }

      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, roomConfig: roomCfg }),
      })

      if (res.ok) {
        const data = await res.json()
        setRoomId(data.roomId)
        setRoomConfig(data.roomConfig)
        setCells(board)
        setEndpointCells(epCells)
        setGameStarted(true)
        return data.roomId
      }
    } catch (error) {
      console.error("创建房间失败:", error)
    }
    return null
  }

  // 加入房间
  const handleJoinRoom = async (id: string): Promise<{ success: boolean; roomConfig?: any }> => {
    try {
      const res = await fetch(`/api/room?roomId=${id}`)
      const data = await res.json()

      if (data.exists && data.state) {
        setRoomId(id.toUpperCase())
        setRoomConfig(data.roomConfig)
        setRemoteState(data.state)
        if (data.state.players?.length > 0) setPlayers(data.state.players)
        setCurrentPlayerIndex(data.state.currentPlayerIndex)
        setCanRollAgain(data.state.canRollAgain)
        setWinner(data.state.winner)
        if (data.state.cells?.length > 0) setCells(data.state.cells)
        if (data.state.endpointCells?.length > 0) setEndpointCells(data.state.endpointCells)
        if (data.state.timer) setTimerState(data.state.timer)
        setGameStarted(true)
        return { success: true, roomConfig: data.roomConfig }
      }
    } catch (error) {
      console.error("加入房间失败:", error)
    }
    return { success: false }
  }

  // 本地游戏
  const handlePlayLocal = () => {
    setRoomId(null)
    initLocalGame(config)
    setGameStarted(true)
  }

  // 选择座位
  const handleSeatSelected = async (seatIndex: number, gender: "male" | "female") => {
    if (!roomId) return

    const name = playerName || `玩家${Math.floor(Math.random() * 10000)}`
    setPlayerName(name)

    const success = await updateSeat(seatIndex, playerId, name)
    if (success) {
      setMySeatIndex(seatIndex)
    }
  }

  // 保存配置
  const handleConfigSave = (newConfig: GameConfig) => {
    setConfig(newConfig)
    initLocalGame(newConfig)
  }

  // 获取格子内容
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

  // 点击格子预览
  const handleCellClick = useCallback(
    (index: number) => {
      const cell = getCellContent(index)
      if (cell) {
        setPreviewCell({ cell, index })
      }
    },
    [getCellContent],
  )

  const handleDiceRoll = (value: number) => {
    if (players.length === 0) return
    if (!isMyTurn && roomId) return // 多端模式下不是自己的回合时不能投骰子

    const currentPlayer = players[currentPlayerIndex]
    if (!currentPlayer) return

    if (currentPlayer.isSkipped) {
      // 跳过当前玩家
      const updatedPlayers = [...players]
      updatedPlayers[currentPlayerIndex] = { ...currentPlayer, isSkipped: false }
      setPlayers(updatedPlayers)
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length)
      setTimeout(() => {
        isLocalUpdateRef.current = true
        pushState({
          players: updatedPlayers,
          currentPlayerIndex: (currentPlayerIndex + 1) % players.length,
          canRollAgain: false,
          winner: null,
          cells,
          endpointCells,
          timer: timerState,
        })
      }, 50)
      return
    }

    setIsRolling(true)
    setCanRollAgain(false)
    setPreviewCell(null)

    let newPos = currentPlayer.position + value

    if (newPos >= totalCells - 1) {
      newPos = totalCells - 1
      setWinner(currentPlayer.name)
    }

    const updatedPlayers = [...players]
    updatedPlayers[currentPlayerIndex] = { ...currentPlayer, position: newPos }
    setPlayers(updatedPlayers)

    setTimeout(() => {
      let task = getCellContent(newPos)
      if (task && !winner) {
        // 根据玩家性别获取适合的任务
        task = getCellContentForPlayer(task, currentPlayer.gender, config)
        setCurrentTask(task)
      } else {
        const nextIndex = (currentPlayerIndex + 1) % players.length
        setCurrentPlayerIndex(nextIndex)
        isLocalUpdateRef.current = true
        pushState({
          players: updatedPlayers,
          currentPlayerIndex: nextIndex,
          canRollAgain: false,
          winner: newPos >= totalCells - 1 ? currentPlayer.name : null,
          cells,
          endpointCells,
          timer: timerState,
        })
      }
      setIsRolling(false)
    }, 500)
  }

  // 完成任务
  const handleTaskComplete = (effect?: GameCell["effect"]) => {
    setCurrentTask(null)

    const updatedPlayers = [...players]
    const currentPlayer = players[currentPlayerIndex]
    let nextIndex = currentPlayerIndex
    let shouldRollAgain = false

    if (effect && players.length > 0 && currentPlayer) {
      switch (effect.type) {
        case "move":
          if (effect.value) {
            let newPos = effect.value === -999 ? 0 : currentPlayer.position + effect.value
            newPos = Math.max(0, Math.min(newPos, totalCells - 1))
            updatedPlayers[currentPlayerIndex] = { ...currentPlayer, position: newPos }
            setPlayers(updatedPlayers)
          }
          break
        case "skip":
          updatedPlayers[currentPlayerIndex] = { ...currentPlayer, isSkipped: true }
          setPlayers(updatedPlayers)
          break
        case "again":
          shouldRollAgain = true
          setCanRollAgain(true)
          setIsRolling(false)
          break
        case "swap":
          // 与下一个玩家交换位置
          const swapIndex = (currentPlayerIndex + 1) % players.length
          const tempPos = currentPlayer.position
          updatedPlayers[currentPlayerIndex] = { ...currentPlayer, position: players[swapIndex].position }
          updatedPlayers[swapIndex] = { ...players[swapIndex], position: tempPos }
          setPlayers(updatedPlayers)
          break
      }
    }

    if (!winner && !shouldRollAgain) {
      nextIndex = (currentPlayerIndex + 1) % players.length
      setCurrentPlayerIndex(nextIndex)
    }

    setTimeout(() => {
      isLocalUpdateRef.current = true
      pushState({
        players: updatedPlayers,
        currentPlayerIndex: shouldRollAgain ? currentPlayerIndex : nextIndex,
        canRollAgain: shouldRollAgain,
        winner,
        cells,
        endpointCells,
        timer: timerState,
      })
    }, 50)
  }

  // 重新开始
  const handleRestart = () => {
    if (roomId && roomConfig) {
      // 在线模式：重置玩家位置
      const resetPlayers = players.map((p) => ({ ...p, position: 0, isSkipped: false }))
      setPlayers(resetPlayers)
      setCurrentPlayerIndex(0)
      setWinner(null)
      setCurrentTask(null)
      setCanRollAgain(false)

      const board = generateBoard(config)
      const epCells = shuffleArray([...config.endpointCells])
      setCells(board)
      setEndpointCells(epCells)

      setTimeout(() => {
        isLocalUpdateRef.current = true
        pushState({
          players: resetPlayers,
          currentPlayerIndex: 0,
          canRollAgain: false,
          winner: null,
          cells: board,
          endpointCells: epCells,
          timer: { duration: 60, timeLeft: 60, isRunning: false },
        })
      }, 50)
    } else {
      initLocalGame(config)
    }
  }

  const handleTimerChange = useCallback(
    (state: TimerState) => {
      setTimerState(state)
      if (roomId && gameStarted) {
        isLocalUpdateRef.current = true
        pushState({
          players,
          currentPlayerIndex,
          canRollAgain,
          winner,
          cells,
          endpointCells,
          timer: state,
        })
      }
    },
    [roomId, gameStarted, players, currentPlayerIndex, canRollAgain, winner, cells, endpointCells, pushState],
  )

  // 计算玩家位置
  const playerPositions = useMemo(() => {
    const positions: { [key: number]: PlayerState[] } = {}
    players.forEach((p) => {
      if (!positions[p.position]) positions[p.position] = []
      positions[p.position].push(p)
    })
    return positions
  }, [players])

  // 加载中
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

  // 房间选择界面
  if (syncEnabled && !gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-50 to-pink-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <h1 className="text-2xl md:text-3xl font-bold text-rose-600 text-center mb-6 flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 md:w-8 md:h-8 fill-rose-500" />
            情侣飞行棋
          </h1>
          <RoomManager
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onPlayLocal={handlePlayLocal}
            onSeatSelected={handleSeatSelected}
            roomConfig={roomConfig}
            roomId={roomId}
            playerId={playerId}
          />
        </div>
      </div>
    )
  }

  // 等待入座界面
  if (syncEnabled && gameStarted && roomId && roomConfig && !roomConfig.seats.every((s) => s.playerId !== null)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-50 to-pink-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <h1 className="text-2xl md:text-3xl font-bold text-rose-600 text-center mb-6 flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 md:w-8 md:h-8 fill-rose-500" />
            情侣飞行棋
          </h1>
          <RoomManager
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onPlayLocal={handlePlayLocal}
            onSeatSelected={handleSeatSelected}
            roomConfig={roomConfig}
            roomId={roomId}
            playerId={playerId}
          />
        </div>
      </div>
    )
  }

  const currentPlayer = players[currentPlayerIndex]

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
            {/* 玩家列表 - 移动端紧凑显示 */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {players.slice(0, 2).map((player, index) => (
                <PlayerPanel
                  key={player.id}
                  playerIndex={index}
                  name={player.name}
                  gender={player.gender}
                  position={player.position}
                  isCurrentPlayer={currentPlayerIndex === index}
                  totalCells={totalCells}
                  isSkipped={player.isSkipped}
                />
              ))}
            </div>

            {/* 更多玩家 - 紧凑模式 */}
            {players.length > 2 && (
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-1">
                {players.slice(2).map((player, index) => (
                  <PlayerPanel
                    key={player.id}
                    playerIndex={index + 2}
                    name={player.name}
                    gender={player.gender}
                    position={player.position}
                    isCurrentPlayer={currentPlayerIndex === index + 2}
                    totalCells={totalCells}
                    isSkipped={player.isSkipped}
                    compact
                  />
                ))}
              </div>
            )}

            {/* 骰子和计时器 */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <div className="bg-white/90 rounded-xl p-3 md:p-4 text-center shadow-lg">
                <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">
                  {canRollAgain ? (
                    <span className="text-yellow-600 font-bold">可以再掷!</span>
                  ) : currentPlayer ? (
                    <>
                      <span className={currentPlayer.gender === "male" ? "text-blue-600" : "text-pink-600"}>
                        {currentPlayer.name}
                      </span>{" "}
                      的回合
                    </>
                  ) : (
                    "等待开始"
                  )}
                </p>
                <div className="flex justify-center">
                  <Dice
                    onRoll={handleDiceRoll}
                    disabled={isRolling || !!currentTask || !!winner || players.length === 0}
                    isMyTurn={isMyTurn}
                  />
                </div>
              </div>

              <GameTimer syncState={timerState} onStateChange={handleTimerChange} />
            </div>

            {previewCell && (
              <div className="lg:hidden bg-white/90 rounded-xl p-3 shadow-lg border-2 border-amber-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">格子 #{previewCell.index + 1}</span>
                  <button
                    onClick={() => setPreviewCell(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm font-medium text-center text-gray-800">{previewCell.cell.content}</p>
              </div>
            )}

            {/* 游戏规则 */}
            <div className="hidden lg:block bg-white/70 rounded-xl p-3 text-sm">
              <h3 className="font-bold mb-2 text-rose-600">游戏规则</h3>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>• 玩家轮流投掷骰子前进</li>
                <li>• 完成格子上的任务后换下一位</li>
                <li>• 不同颜色格子有不同任务类型</li>
                <li>• 部分格子有前进/后退等效果</li>
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
              playerPositions={playerPositions}
              currentPlayerIndex={currentPlayerIndex}
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
      {currentTask && (
        <TaskModal
          cell={currentTask}
          onComplete={handleTaskComplete}
          playerName={currentPlayer?.name || "玩家"}
          playerGender={currentPlayerGender}
          config={config}
        />
      )}

      {showConfig && <ConfigModal config={config} onSave={handleConfigSave} onClose={() => setShowConfig(false)} />}

      {winner && <WinnerModal winner={winner} reward={config.endpointContent.reward} onRestart={handleRestart} />}
    </main>
  )
}
