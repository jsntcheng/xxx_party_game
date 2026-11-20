"use client"

import { Modal } from "@/components/ui/modal"
import { describeEffect, TILE_LABELS } from "@/lib/game/meta"
import type { GameCell } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import { PLAYER_STYLES, TILE_STYLES } from "./tile-style"

interface TilePreviewProps {
  cell: GameCell | null
  index: number
  onClose: () => void
}

/** 点击棋盘格子查看内容；甜蜜任务落地才抽，这里只显示抽取说明。 */
export function TilePreview({ cell, index, onClose }: TilePreviewProps) {
  if (!cell) return null
  const style = TILE_STYLES[cell.type]
  const Icon = style.icon
  const effect = describeEffect(cell.effect)
  const label = TILE_LABELS[cell.type]
  const sweet = cell.type === "normal"
  return (
    <Modal open onOpenChange={(open) => !open && onClose()} title={`第 ${index} 格 · ${label.name}`} className="max-w-xs">
      <div className="flex items-start gap-3">
        <div className={cn("grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white", style.accent)}>
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="leading-relaxed text-white">{sweet ? label.description : cell.content}</p>
          {effect && <p className="mt-2 text-xs text-amber-200/90">{effect}</p>}
          {!sweet && cell.player !== "both" && (
            <p className={cn("mt-2 text-xs", PLAYER_STYLES[cell.player].text)}>
              {PLAYER_STYLES[cell.player].label}专属（另一方落到这里会自动换成适合 TA 的任务）
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
