"use client"

import { motion } from "framer-motion"
import { memo, type CSSProperties } from "react"
import { TILE_LABELS } from "@/lib/game/meta"
import type { GameCell, PlayerState, Seat } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import { PLAYER_STYLES, TILE_STYLES } from "./tile-style"

const COLS = 8
/** 以格子边长为 10 的单位坐标系，格间距 1.4。 */
const UNIT = 10
const GAP = 1.4
const PITCH = UNIT + GAP

interface BoardProps {
  board: GameCell[]
  players: [PlayerState, PlayerState]
  /** 动画中的棋子位置。 */
  positions: [number, number]
  turn: Seat
  /** 当前任务所在格，高亮显示。 */
  highlight: number | null
  onPreview: (index: number) => void
}

/** 蛇形排列：偶数行从左到右，奇数行从右到左。 */
function coordOf(index: number) {
  const row = Math.floor(index / COLS)
  const offset = index % COLS
  return { row, col: row % 2 === 0 ? offset : COLS - 1 - offset }
}

export function Board({ board, players, positions, turn, highlight, onPreview }: BoardProps) {
  const rows = Math.ceil(board.length / COLS)
  const width = COLS * PITCH - GAP
  const height = rows * PITCH - GAP
  const center = (index: number) => {
    const { row, col } = coordOf(index)
    return { x: col * PITCH + UNIT / 2, y: row * PITCH + UNIT / 2 }
  }
  const path = board
    .map((_, index) => {
      const { x, y } = center(index)
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: `${width} / ${height}` }}>
      <svg className="absolute inset-0 size-full" viewBox={`0 0 ${width} ${height}`} aria-hidden>
        <defs>
          <linearGradient id="board-path" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f9a8d4" />
            <stop offset="0.5" stopColor="#c084fc" />
            <stop offset="1" stopColor="#fdba74" />
          </linearGradient>
        </defs>
        <polyline
          points={path}
          fill="none"
          stroke="url(#board-path)"
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0.1 2.2"
          opacity={0.55}
        />
      </svg>

      {board.map((cell, index) => (
        <Tile
          key={index}
          cell={cell}
          index={index}
          style={tileBox(index, width, height)}
          highlighted={highlight === index}
          onPreview={onPreview}
        />
      ))}

      {([0, 1] as const).map((seat) => {
        const position = positions[seat]
        const { x, y } = center(position)
        const shared = positions[0] === positions[1]
        const shift = shared ? (seat === 0 ? -UNIT * 0.2 : UNIT * 0.2) : 0
        const player = players[seat]
        const style = PLAYER_STYLES[player.gender]
        return (
          <motion.div
            key={seat}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ width: `${(UNIT * 0.62 * 100) / width}%`, aspectRatio: "1" }}
            initial={false}
            animate={{ left: `${((x + shift) * 100) / width}%`, top: `${((y - UNIT * 0.06) * 100) / height}%` }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
          >
            <motion.div
              key={position}
              initial={{ y: 0 }}
              animate={{ y: ["0%", "-38%", "0%"] }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              className={cn(
                "flex size-full items-center justify-center rounded-full bg-gradient-to-br text-[clamp(9px,2.6vw,15px)] font-bold text-white shadow-lg ring-2 ring-white/90",
                style.piece,
                turn === seat && "animate-glow",
              )}
              style={{ ["--glow-color" as string]: style.glow }}
            >
              {[...player.name][0] ?? "?"}
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}

function tileBox(index: number, width: number, height: number) {
  const { row, col } = coordOf(index)
  return {
    left: `${(col * PITCH * 100) / width}%`,
    top: `${(row * PITCH * 100) / height}%`,
    width: `${(UNIT * 100) / width}%`,
    height: `${(UNIT * 100) / height}%`,
  }
}

interface TileProps {
  cell: GameCell
  index: number
  style: CSSProperties
  highlighted: boolean
  onPreview: (index: number) => void
}

const Tile = memo(function Tile({ cell, index, style, highlighted, onPreview }: TileProps) {
  const kind = TILE_STYLES[cell.type]
  const Icon = kind.icon
  const label = TILE_LABELS[cell.type].name
  const isGoal = cell.type === "end"
  return (
    <button
      type="button"
      onClick={() => onPreview(index)}
      aria-label={`第 ${index} 格：${label}`}
      className={cn(
        "absolute flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[24%] text-white transition hover:z-[5] hover:scale-110 focus-visible:z-[5] focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-pink-200",
        kind.tile,
        isGoal && "shadow-[0_0_24px_rgb(251_191_36/0.55)]",
        highlighted && "z-[4] scale-110 ring-2 ring-white",
      )}
      style={style}
    >
      {index > 0 && !isGoal && (
        <span className="absolute top-[6%] left-[10%] hidden text-[9px] leading-none font-semibold text-white/55 sm:block">
          {index}
        </span>
      )}
      <Icon className={cn("size-[42%] drop-shadow", cell.type === "normal" && "text-pink-200/80")} strokeWidth={2.2} />
      <span className="hidden max-w-full truncate px-0.5 text-[10px] leading-none font-medium text-white/85 md:block">
        {label}
      </span>
    </button>
  )
})
