/** 格子类型 → 视觉（渐变色、图标、光晕色），棋盘、任务弹窗、配置编辑器共用。 */
import {
  ArrowLeftRight,
  ChevronsLeft,
  ChevronsRight,
  Crown,
  Dices,
  Flag,
  Flame,
  Gift,
  Heart,
  HeartHandshake,
  Hourglass,
  MessageCircleHeart,
  Sparkles,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react"
import type { Gender, TileKind } from "@/lib/game/types"

interface TileStyle {
  icon: LucideIcon
  /** 格子背景（Tailwind 渐变类）。 */
  tile: string
  /** 任务卡片顶部的强调渐变。 */
  accent: string
  /** 粒子/光晕颜色。 */
  glow: string
}

const EFFECT_GLOSS = "ring-1 ring-inset ring-white/25 shadow-lg"

export const TILE_STYLES: Record<TileKind, TileStyle> = {
  start: { icon: Flag, tile: `bg-gradient-to-br from-emerald-400 to-teal-500 ${EFFECT_GLOSS}`, accent: "from-emerald-400 to-teal-500", glow: "#34d399" },
  end: { icon: Crown, tile: `bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 ${EFFECT_GLOSS} shadow-amber-500/40`, accent: "from-amber-300 to-orange-500", glow: "#fbbf24" },
  normal: { icon: Sparkles, tile: "bg-white/[0.07] ring-1 ring-inset ring-white/10", accent: "from-rose-400 to-fuchsia-500", glow: "#f472b6" },
  truth: { icon: MessageCircleHeart, tile: `bg-gradient-to-br from-sky-400/90 to-blue-600/90 ${EFFECT_GLOSS}`, accent: "from-sky-400 to-blue-600", glow: "#38bdf8" },
  dare: { icon: Zap, tile: `bg-gradient-to-br from-violet-400/90 to-purple-600/90 ${EFFECT_GLOSS}`, accent: "from-violet-400 to-purple-600", glow: "#a78bfa" },
  kiss: { icon: Heart, tile: `bg-gradient-to-br from-pink-400/90 to-rose-600/90 ${EFFECT_GLOSS}`, accent: "from-pink-400 to-rose-600", glow: "#fb7185" },
  hug: { icon: HeartHandshake, tile: `bg-gradient-to-br from-fuchsia-400/90 to-pink-600/90 ${EFFECT_GLOSS}`, accent: "from-fuchsia-400 to-pink-600", glow: "#e879f9" },
  punishment: { icon: Flame, tile: `bg-gradient-to-br from-orange-400/90 to-red-600/90 ${EFFECT_GLOSS}`, accent: "from-orange-400 to-red-600", glow: "#fb923c" },
  reward: { icon: Gift, tile: `bg-gradient-to-br from-emerald-400/90 to-teal-600/90 ${EFFECT_GLOSS}`, accent: "from-emerald-400 to-teal-600", glow: "#34d399" },
  forward: { icon: ChevronsRight, tile: `bg-gradient-to-br from-lime-400/90 to-green-600/90 ${EFFECT_GLOSS}`, accent: "from-lime-400 to-green-600", glow: "#a3e635" },
  backward: { icon: ChevronsLeft, tile: `bg-gradient-to-br from-red-400/90 to-rose-700/90 ${EFFECT_GLOSS}`, accent: "from-red-400 to-rose-700", glow: "#f87171" },
  skip: { icon: Hourglass, tile: `bg-gradient-to-br from-slate-400/90 to-slate-600/90 ${EFFECT_GLOSS}`, accent: "from-slate-400 to-slate-600", glow: "#94a3b8" },
  again: { icon: Dices, tile: `bg-gradient-to-br from-amber-300/90 to-yellow-500/90 ${EFFECT_GLOSS}`, accent: "from-amber-300 to-yellow-500", glow: "#fcd34d" },
  swap: { icon: ArrowLeftRight, tile: `bg-gradient-to-br from-indigo-400/90 to-blue-600/90 ${EFFECT_GLOSS}`, accent: "from-indigo-400 to-blue-600", glow: "#818cf8" },
  endpoint: { icon: Star, tile: `bg-gradient-to-br from-amber-400/90 to-orange-600/90 ${EFFECT_GLOSS}`, accent: "from-amber-400 to-orange-600", glow: "#fb923c" },
}

/** 玩家棋子配色。 */
export const PLAYER_STYLES: Record<Gender, { piece: string; text: string; glow: string; label: string }> = {
  male: { piece: "from-sky-300 to-blue-600", text: "text-sky-300", glow: "rgb(56 189 248 / 0.8)", label: "男生" },
  female: { piece: "from-pink-300 to-rose-600", text: "text-pink-300", glow: "rgb(244 114 182 / 0.85)", label: "女生" },
}
