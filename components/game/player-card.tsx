import { Hourglass } from "lucide-react"
import type { SeatStatus } from "@/lib/api-types"
import type { PlayerState } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import { PLAYER_STYLES } from "./tile-style"

interface PlayerCardProps {
  player: PlayerState
  status: SeatStatus
  /** 动画中的位置。 */
  position: number
  goal: number
  active: boolean
  isMe: boolean
  /** 联机模式才显示在线状态。 */
  showPresence: boolean
}

export function PlayerCard({ player, status, position, goal, active, isMe, showPresence }: PlayerCardProps) {
  const style = PLAYER_STYLES[player.gender]
  const progress = Math.round((position / goal) * 100)
  const waiting = showPresence && !status.taken
  return (
    <div
      className={cn(
        "glass relative flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-3 transition",
        active && "border-white/25 bg-white/[0.11] shadow-lg shadow-pink-500/10",
      )}
    >
      <div
        className={cn(
          "relative flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-white ring-2 ring-white/70",
          style.piece,
          active && "animate-glow",
          waiting && "opacity-40 grayscale",
        )}
        style={{ ["--glow-color" as string]: style.glow }}
      >
        {waiting ? "?" : ([...player.name][0] ?? "?")}
        {showPresence && status.taken && (
          <span
            className={cn(
              "absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-night",
              status.online ? "bg-emerald-400" : "bg-white/30",
            )}
            title={status.online ? "在线" : "离线"}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold text-white">{waiting ? "等待加入…" : player.name}</span>
          {isMe && <span className="shrink-0 rounded-md bg-white/15 px-1.5 py-px text-[10px] text-white/80">你</span>}
          {player.skipNext && (
            <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-slate-400/25 px-1.5 py-px text-[10px] text-slate-200">
              <Hourglass className="size-3" />
              停一轮
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-300", style.piece)}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={cn("shrink-0 text-xs tabular-nums", style.text)}>
            {position}/{goal}
          </span>
        </div>
      </div>
    </div>
  )
}
