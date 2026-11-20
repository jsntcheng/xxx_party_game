"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Select, Textarea } from "@/components/ui/input"
import { CELL_LIST_META } from "@/lib/game/meta"
import {
  BACK_TO_START,
  EFFECT_TASK_TYPES,
  type Audience,
  type CellEffect,
  type CellListKey,
  type EffectTaskType,
  type GameCell,
} from "@/lib/game/types"
import { nextId } from "./utils"

type EffectKind = "none" | "forward" | "backward" | "start" | "skip" | "again" | "swap"

const EFFECT_OPTIONS: { kind: EffectKind; label: string }[] = [
  { kind: "none", label: "无效果" },
  { kind: "forward", label: "前进" },
  { kind: "backward", label: "后退" },
  { kind: "start", label: "回到起点" },
  { kind: "skip", label: "停一轮" },
  { kind: "again", label: "再掷一次" },
  { kind: "swap", label: "交换位置" },
]
const EFFECT_CELL_OPTIONS = EFFECT_OPTIONS.filter((option) => EFFECT_TASK_TYPES.includes(option.kind as EffectTaskType))

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: "both", label: "双方" },
  { value: "male", label: "仅男生" },
  { value: "female", label: "仅女生" },
]

function kindOf(effect: CellEffect | undefined): EffectKind {
  if (!effect) return "none"
  if (effect.type !== "move") return effect.type
  if (effect.value === BACK_TO_START) return "start"
  return effect.value > 0 ? "forward" : "backward"
}

function buildEffect(kind: EffectKind, steps: number): CellEffect | undefined {
  switch (kind) {
    case "none":
      return undefined
    case "forward":
      return { type: "move", value: steps }
    case "backward":
      return { type: "move", value: -steps }
    case "start":
      return { type: "move", value: BACK_TO_START }
    default:
      return { type: kind }
  }
}

const stepsOf = (effect: CellEffect | undefined) =>
  effect?.type === "move" && effect.value !== BACK_TO_START ? Math.abs(effect.value) : 2

interface CellListEditorProps {
  listKey: CellListKey
  cells: GameCell[]
  onChange: (cells: GameCell[]) => void
}

/** 编辑一个任务列表：内容、适用对象、完成后效果。 */
export function CellListEditor({ listKey, cells, onChange }: CellListEditorProps) {
  const meta = CELL_LIST_META[listKey]
  const isEffectList = listKey === "effectCells"
  const fixedAudience = listKey === "maleCells" || listKey === "femaleCells"

  const update = (index: number, patch: Partial<GameCell>) =>
    onChange(cells.map((cell, i) => (i === index ? { ...cell, ...patch } : cell)))

  const setEffect = (index: number, kind: EffectKind, steps: number) => {
    const effect = buildEffect(kind, steps)
    // 效果格的类型由效果决定，保证棋盘图标与实际效果一致
    update(index, isEffectList ? { effect, type: kind as EffectTaskType } : { effect })
  }

  const add = () => {
    const cell: GameCell = {
      id: nextId(cells),
      content: "",
      type: meta.type,
      player: listKey === "maleCells" ? "male" : listKey === "femaleCells" ? "female" : "both",
      ...(isEffectList && { effect: { type: "move", value: 2 } as CellEffect }),
    }
    onChange([cell, ...cells])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-white/50">
          {LIST_HINTS[listKey] ?? `共 ${cells.length} 条，空白条目保存时会被忽略`}
        </p>
        <Button size="sm" onClick={add}>
          <Plus />
          添加
        </Button>
      </div>
      {cells.length === 0 && <p className="py-8 text-center text-sm text-white/40">还没有内容，点「添加」写一条吧</p>}
      <ul className="space-y-2">
        {cells.map((cell, index) => {
          const kind = kindOf(cell.effect)
          const steps = stepsOf(cell.effect)
          return (
            <li key={`${cell.id}-${index}`} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/8">
              <div className="flex gap-2">
                <Textarea
                  value={cell.content}
                  maxLength={200}
                  rows={2}
                  placeholder="写下任务内容…"
                  className="min-h-16 flex-1"
                  onChange={(event) => update(index, { content: event.target.value })}
                />
                <Button
                  variant="danger"
                  size="icon-sm"
                  aria-label="删除"
                  onClick={() => onChange(cells.filter((_, i) => i !== index))}
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {!fixedAudience && (
                  <Select
                    aria-label="适用对象"
                    className="h-9 w-auto"
                    value={cell.player}
                    onChange={(event) => update(index, { player: event.target.value as Audience })}
                  >
                    {AUDIENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}
                <Select
                  aria-label="完成后效果"
                  className="h-9 w-auto"
                  value={kind}
                  onChange={(event) => setEffect(index, event.target.value as EffectKind, steps)}
                >
                  {(isEffectList ? EFFECT_CELL_OPTIONS : EFFECT_OPTIONS).map((option) => (
                    <option key={option.kind} value={option.kind}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                {(kind === "forward" || kind === "backward") && (
                  <label className="flex items-center gap-1.5 text-sm text-white/60">
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      className="h-9 w-16 text-center"
                      value={steps}
                      onChange={(event) => setEffect(index, kind, Math.min(60, Math.max(1, Number(event.target.value) || 1)))}
                    />
                    格
                  </label>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const LIST_HINTS: Partial<Record<CellListKey, string>> = {
  normalCells: "甜蜜任务格的通用任务；标成「仅男生 / 仅女生」的只会被对应一方抽到",
  maleCells: "男生落到甜蜜任务格时，和「普通」里适合男生的任务一起抽",
  femaleCells: "女生落到甜蜜任务格时，和「普通」里适合女生的任务一起抽",
  effectCells: "前进、后退、停一轮、再掷、交换等纯效果格",
  endpointCells: "终点前的冲刺区，每局最多随机放 6 格",
}
