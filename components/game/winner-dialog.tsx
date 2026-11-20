"use client"

import { Crown, RotateCcw } from "lucide-react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import type { EndpointContent, PlayerState } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import { celebrate } from "./effects"
import { PLAYER_STYLES } from "./tile-style"

interface WinnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  winner: PlayerState
  isMe: boolean
  endpoint: EndpointContent
  busy: boolean
  onRestart: () => void
}

export function WinnerDialog({ open, onOpenChange, winner, isMe, endpoint, busy, onRestart }: WinnerDialogProps) {
  useEffect(() => {
    if (open) celebrate()
  }, [open])

  const headline = isMe ? "你赢啦！" : `${winner.name} 赢啦！`

  return (
    <Modal open={open} onOpenChange={onOpenChange} hideTitle title={headline} className="max-w-sm">
      <div className="flex flex-col items-center pt-2 text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-2xl" />
          <div className="relative grid size-24 place-items-center rounded-full bg-gradient-to-br from-amber-200 via-yellow-400 to-orange-500 shadow-2xl shadow-amber-500/40">
            <Crown className="size-12 text-white drop-shadow" strokeWidth={1.8} />
          </div>
        </div>
        <p className="text-sm text-white/50">{endpoint.title}</p>
        <h2 className="text-gradient mt-1 text-3xl font-bold">{headline}</h2>
        <p className="mt-2 text-white/70">{endpoint.subtitle}</p>
        <div className="mt-5 w-full rounded-2xl bg-gradient-to-br from-amber-300/15 to-pink-400/10 p-4 ring-1 ring-amber-200/20">
          <p className="text-xs tracking-[0.2em] text-amber-200/80">胜利奖励</p>
          <p className="mt-1.5 text-lg leading-relaxed font-medium text-white">{endpoint.reward}</p>
        </div>
        <p className={cn("mt-4 text-xs", PLAYER_STYLES[winner.gender].text)}>
          {PLAYER_STYLES[winner.gender].label} {winner.name} 获胜
        </p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          看看棋盘
        </Button>
        <Button variant="gold" disabled={busy} onClick={onRestart}>
          <RotateCcw />
          再来一局
        </Button>
      </div>
    </Modal>
  )
}
