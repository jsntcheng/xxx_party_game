"use client"

import { Check, Shuffle, Timer as TimerIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { describeEffect, TILE_LABELS } from "@/lib/game/meta"
import type { GameAction, PendingTask, PlayerState, TimerState } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import { PLAYER_STYLES, TILE_STYLES } from "./tile-style"
import { Timer } from "./timer"

interface TaskDialogProps {
  pending: PendingTask
  player: PlayerState
  /** 由当前操作者执行（联机时只有落子方可换任务）。 */
  isOwner: boolean
  canChange: boolean
  busy: boolean
  timer: TimerState
  now: () => number
  onAction: (action: GameAction) => void
}

/** 落子后的任务卡：必须完成才能继续；可打开计时器辅助计时类任务。 */
export function TaskDialog({ pending, player, isOwner, canChange, busy, timer, now, onAction }: TaskDialogProps) {
  const { task, cellIndex } = pending
  const style = TILE_STYLES[task.type]
  const Icon = style.icon
  const effect = describeEffect(task.effect)
  const [showTimer, setShowTimer] = useState(timer.endsAt !== null)

  return (
    <Modal open persistent hideTitle title={`${player.name} 的任务`} className="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "relative -mt-1 mb-4 grid size-20 place-items-center rounded-3xl bg-gradient-to-br text-white shadow-xl",
            style.accent,
          )}
          style={{ boxShadow: `0 12px 40px -8px ${style.glow}` }}
        >
          <Icon className="size-10 drop-shadow" strokeWidth={1.8} />
        </div>
        <p className="text-xs tracking-[0.2em] text-white/45">
          第 {cellIndex} 格 · {TILE_LABELS[task.type].name}
        </p>
        <p className="mt-1 text-sm">
          <span className={cn("font-semibold", PLAYER_STYLES[player.gender].text)}>{player.name}</span>
          <span className="text-white/60"> 的任务</span>
        </p>
        <p className="mt-4 text-xl leading-relaxed font-semibold text-balance text-white">{task.content}</p>
        {effect && (
          <p className="mt-3 rounded-full bg-white/8 px-3 py-1 text-xs text-amber-200/90 ring-1 ring-amber-200/20">
            {effect}
          </p>
        )}
        {pending.changed && <p className="mt-2 text-xs text-white/40">已经换过一次</p>}
      </div>

      {showTimer && (
        <div className="mt-5">
          <Timer timer={timer} now={now} disabled={busy} onAction={onAction} />
        </div>
      )}

      <div className="mt-6 grid gap-2">
        <Button size="lg" disabled={busy} onClick={() => onAction({ type: "completeTask" })}>
          <Check />
          {isOwner ? "完成啦" : `${player.name} 完成了`}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setShowTimer((value) => !value)}>
            <TimerIcon />
            {showTimer ? "收起计时" : "计时"}
          </Button>
          <Button
            variant="secondary"
            disabled={busy || !canChange || !isOwner}
            title={canChange ? "重新抽一个适合你的任务（每格一次）" : "只有甜蜜任务能换，每格一次"}
            onClick={() => onAction({ type: "changeTask" })}
          >
            <Shuffle />
            换一个
          </Button>
        </div>
      </div>
    </Modal>
  )
}
