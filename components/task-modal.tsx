"use client"

import type React from "react"
import { useState, useMemo } from "react"
import type { GameCell, CellType, GameConfig } from "@/lib/game-data"
import { specialCellConfigs } from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Heart,
  X,
  ArrowUp,
  ArrowDown,
  Pause,
  RotateCw,
  MessageCircle,
  Flame,
  Sparkles,
  Gift,
  AlertTriangle,
  Shuffle,
  RefreshCw,
} from "lucide-react"

interface TaskModalProps {
  cell: GameCell | null
  onComplete: (effect?: GameCell["effect"]) => void
  playerName: string
  currentPlayerGender?: "male" | "female"
  config?: GameConfig
  cellIndex?: number
  canChangeTask?: boolean
  onTaskChange?: (newCell: GameCell) => void
}

const getCellTypeInfo = (type: CellType) => {
  const config = specialCellConfigs.find((c) => c.type === type)

  const iconMap: { [key in CellType]?: React.ReactNode } = {
    forward: <ArrowUp className="w-8 h-8" />,
    backward: <ArrowDown className="w-8 h-8" />,
    skip: <Pause className="w-8 h-8" />,
    again: <RotateCw className="w-8 h-8" />,
    truth: <MessageCircle className="w-8 h-8" />,
    dare: <Flame className="w-8 h-8" />,
    kiss: <Heart className="w-8 h-8 fill-current" />,
    hug: <Sparkles className="w-8 h-8" />,
    reward: <Gift className="w-8 h-8" />,
    punishment: <AlertTriangle className="w-8 h-8" />,
    swap: <Shuffle className="w-8 h-8" />,
  }

  const bgMap: { [key in CellType]?: string } = {
    forward: "bg-green-100 text-green-700",
    backward: "bg-red-100 text-red-700",
    skip: "bg-gray-100 text-gray-700",
    again: "bg-yellow-100 text-yellow-700",
    truth: "bg-blue-100 text-blue-700",
    dare: "bg-purple-100 text-purple-700",
    kiss: "bg-pink-100 text-pink-700",
    hug: "bg-rose-100 text-rose-700",
    reward: "bg-emerald-100 text-emerald-700",
    punishment: "bg-orange-100 text-orange-700",
    swap: "bg-indigo-100 text-indigo-700",
    normal: "bg-amber-100 text-amber-700",
    "endpoint": "bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700",
  }

  return {
    icon: iconMap[type] || <Heart className="w-8 h-8" />,
    bg: bgMap[type] || "bg-amber-100 text-amber-700",
    name: config?.name || "任务",
  }
}

export function TaskModal({
  cell,
  onComplete,
  playerName,
  currentPlayerGender,
  config,
  cellIndex,
  canChangeTask = false,
  onTaskChange,
}: TaskModalProps) {
  const [currentCell, setCurrentCell] = useState<GameCell | null>(cell)
  const [hasChanged, setHasChanged] = useState(false)

  const genderSpecificTasks = useMemo(() => {
    if (!config || !currentPlayerGender) return []
    return currentPlayerGender === "male" ? config.maleCells : config.femaleCells
  }, [config, currentPlayerGender])

  const [usedTaskIndices, setUsedTaskIndices] = useState<number[]>([])

  const handleChangeTask = () => {
    if (!genderSpecificTasks.length || hasChanged) return

    // Find available tasks that haven't been used
    const availableIndices = genderSpecificTasks
      .map((_, index) => index)
      .filter((index) => !usedTaskIndices.includes(index))

    if (availableIndices.length === 0) {
      // All tasks used, reset
      setUsedTaskIndices([])
      return
    }

    // Pick a random available task
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
    const newTask = genderSpecificTasks[randomIndex]

    setUsedTaskIndices((prev) => [...prev, randomIndex])
    setCurrentCell(newTask)
    setHasChanged(true)
    onTaskChange?.(newTask)
  }

  if (!currentCell) return null

  const typeInfo = getCellTypeInfo(currentCell.type)
  const showChangeButton =
    canChangeTask && currentCell.type === "normal" && genderSpecificTasks.length > 0 && !hasChanged

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span className="font-bold text-lg text-rose-600">{playerName}</span>
          </div>
          <button
            onClick={() => onComplete(currentCell.effect)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <span className={cn("px-4 py-1 rounded-full text-sm font-bold", typeInfo.bg)}>{typeInfo.name}</span>
        </div>

        <div className={cn("p-6 rounded-xl text-center mb-6", typeInfo.bg)}>
          <div className="flex justify-center mb-4 opacity-70">{typeInfo.icon}</div>
          <p className="text-xl font-bold leading-relaxed">{currentCell.content}</p>

          {/* 显示效果提示 */}
          {currentCell.effect && (
            <p className="mt-3 text-sm opacity-70">
              {currentCell.effect.type === "move" &&
                currentCell.effect.value &&
                (currentCell.effect.value > 0
                  ? `完成后前进 ${currentCell.effect.value} 格`
                  : currentCell.effect.value === -999
                    ? "完成后回到起点"
                    : `完成后后退 ${Math.abs(currentCell.effect.value)} 格`)}
              {currentCell.effect.type === "skip" && "下一轮需要暂停"}
              {currentCell.effect.type === "again" && "完成后可以再掷一次"}
              {currentCell.effect.type === "swap" && "完成后与对方交换位置"}
            </p>
          )}

          {hasChanged && (
            <p className="mt-2 text-xs opacity-60">
              已更换为{currentPlayerGender === "male" ? "男方" : "女方"}专属任务
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {showChangeButton && (
            <Button
              onClick={handleChangeTask}
              variant="outline"
              className="flex-1 text-amber-600 border-amber-300 hover:bg-amber-50 bg-transparent"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              换一个
            </Button>
          )}
          <Button
            onClick={() => onComplete(currentCell.effect)}
            className={cn(
              "bg-rose-500 hover:bg-rose-600 text-white text-lg py-6",
              showChangeButton ? "flex-1" : "w-full",
            )}
          >
            完成任务
          </Button>
        </div>
      </div>
    </div>
  )
}
