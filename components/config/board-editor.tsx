"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"
import { ENDPOINT_ZONE_MAX } from "@/lib/game/board"
import { BOARD_SIZE_MAX, BOARD_SIZE_MIN } from "@/lib/game/config"
import { TILE_LABELS } from "@/lib/game/meta"
import { POSITIONABLE_TYPES, type GameConfig, type PositionableType } from "@/lib/game/types"

type BoardFields = Pick<GameConfig, "boardSize" | "specialCellPositions" | "endpointContent">
type PositionEntry = readonly [number, PositionableType]

interface BoardEditorProps {
  value: BoardFields
  onChange: (patch: Partial<BoardFields>) => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** 棋盘长度、固定位置格子、终点文案。 */
export function BoardEditor({ value, onChange }: BoardEditorProps) {
  const { boardSize, specialCellPositions, endpointContent } = value
  const entries = Object.entries(specialCellPositions)
    .map(([position, type]): PositionEntry => [Number(position), type])
    .sort((a, b) => a[0] - b[0])

  const setPositions = (next: PositionEntry[]) => onChange({ specialCellPositions: Object.fromEntries(next) })

  const setBoardSize = (size: number) => {
    const next = clamp(Math.round(size) || BOARD_SIZE_MIN, BOARD_SIZE_MIN, BOARD_SIZE_MAX)
    // 缩短棋盘时丢弃超出范围的固定位置
    onChange({
      boardSize: next,
      specialCellPositions: Object.fromEntries(entries.filter(([position]) => position <= next)),
    })
  }

  /** 修改序号；目标位置已被占用时返回 false。 */
  const movePosition = (from: number, to: number): boolean => {
    const target = clamp(Math.round(to) || 1, 1, boardSize)
    if (target !== from && specialCellPositions[target]) return false
    setPositions(entries.map(([position, type]) => [position === from ? target : position, type]))
    return target === Math.round(to)
  }

  const addPosition = () => {
    const free = Array.from({ length: boardSize }, (_, i) => i + 1).find((position) => !specialCellPositions[position])
    if (free !== undefined) setPositions([...entries, [free, "truth"]])
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-white/85">棋盘长度</h3>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={BOARD_SIZE_MIN}
            max={BOARD_SIZE_MAX}
            value={boardSize}
            onChange={(event) => setBoardSize(Number(event.target.value))}
            className="flex-1 accent-pink-400"
            aria-label="任务格数量"
          />
          <Input
            key={boardSize}
            type="number"
            min={BOARD_SIZE_MIN}
            max={BOARD_SIZE_MAX}
            defaultValue={boardSize}
            onBlur={(event) => setBoardSize(Number(event.target.value))}
            onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
            className="w-20 text-center"
            aria-label="任务格数量"
          />
        </div>
        <p className="text-xs text-white/45">
          任务格 {BOARD_SIZE_MIN}~{BOARD_SIZE_MAX} 个，另外还有起点、终点冲刺区（最多 {ENDPOINT_ZONE_MAX} 格）和终点。
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white/85">固定位置</h3>
            <p className="mt-0.5 text-xs text-white/45">指定第几格放什么类型，其余格子随机生成</p>
          </div>
          <Button size="sm" onClick={addPosition} disabled={entries.length >= boardSize}>
            <Plus />
            添加
          </Button>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {entries.map(([position, type]) => (
            <li key={position} className="flex items-center gap-2 rounded-xl bg-white/5 p-2 ring-1 ring-white/8">
              <span className="text-xs text-white/45">第</span>
              <Input
                type="number"
                min={1}
                max={boardSize}
                defaultValue={position}
                onBlur={(event) => {
                  if (!movePosition(position, Number(event.target.value))) event.target.value = String(position)
                }}
                onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
                className="h-9 w-16 text-center"
                aria-label="格子序号"
              />
              <span className="text-xs text-white/45">格</span>
              <Select
                value={type}
                className="h-9 flex-1"
                aria-label="格子类型"
                onChange={(event) =>
                  setPositions(entries.map(([p, t]) => [p, p === position ? (event.target.value as PositionableType) : t]))
                }
              >
                {POSITIONABLE_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {TILE_LABELS[option].name}
                  </option>
                ))}
              </Select>
              <Button
                variant="danger"
                size="icon-sm"
                aria-label="删除"
                onClick={() => setPositions(entries.filter(([p]) => p !== position))}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-white/85">终点</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-white/55">
            标题
            <Input
              value={endpointContent.title}
              maxLength={20}
              onChange={(event) => onChange({ endpointContent: { ...endpointContent, title: event.target.value } })}
            />
          </label>
          <label className="space-y-1 text-xs text-white/55">
            副标题
            <Input
              value={endpointContent.subtitle}
              maxLength={40}
              onChange={(event) => onChange({ endpointContent: { ...endpointContent, subtitle: event.target.value } })}
            />
          </label>
        </div>
        <label className="block space-y-1 text-xs text-white/55">
          胜利奖励
          <Input
            value={endpointContent.reward}
            maxLength={200}
            onChange={(event) => onChange({ endpointContent: { ...endpointContent, reward: event.target.value } })}
          />
        </label>
      </section>
    </div>
  )
}
