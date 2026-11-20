/**
 * 游戏领域类型（前后端共用，零依赖）。
 *
 * 配置相关类型（GameCell / GameConfig / SceneCard）保持与旧版导出 JSON 相同的字段，
 * 用户之前导出的配置可以直接导入。
 */

/** 配置里可出现的任务类型。 */
export const TASK_TYPES = [
  "normal",
  "truth",
  "dare",
  "kiss",
  "hug",
  "punishment",
  "reward",
  "forward",
  "backward",
  "skip",
  "again",
  "swap",
  "endpoint",
] as const
export type TaskType = (typeof TASK_TYPES)[number]

/** 效果格类型（存放在 config.effectCells 中）。 */
export const EFFECT_TASK_TYPES = ["forward", "backward", "skip", "again", "swap"] as const
export type EffectTaskType = (typeof EFFECT_TASK_TYPES)[number]

/** 可以被「固定位置」指定的类型（终点区与普通格不参与）。 */
export const POSITIONABLE_TYPES = TASK_TYPES.filter(
  (t): t is Exclude<TaskType, "normal" | "endpoint"> => t !== "normal" && t !== "endpoint",
)
export type PositionableType = (typeof POSITIONABLE_TYPES)[number]

/** 棋盘格子种类：任务类型 + 起点/终点。 */
export type TileKind = TaskType | "start" | "end"

export type Gender = "male" | "female"
/** 任务适用对象。 */
export type Audience = Gender | "both"

/** 「回到起点」在旧格式中用 move -999 表示，保持兼容。 */
export const BACK_TO_START = -999

export type CellEffect = { type: "move"; value: number } | { type: "skip" } | { type: "again" } | { type: "swap" }

/** 一条任务（配置项，也是棋盘格子的内容）。 */
export interface GameCell {
  id: number
  content: string
  type: TileKind
  player: Audience
  effect?: CellEffect
}

export interface SceneCard {
  id: number
  title: string
  description: string
  icon?: string
  pool: string
}

export interface EndpointContent {
  title: string
  subtitle: string
  reward: string
}

export interface GameConfig {
  normalCells: GameCell[]
  maleCells: GameCell[]
  femaleCells: GameCell[]
  truthCells: GameCell[]
  dareCells: GameCell[]
  kissCells: GameCell[]
  hugCells: GameCell[]
  punishmentCells: GameCell[]
  rewardCells: GameCell[]
  effectCells: GameCell[]
  endpointCells: GameCell[]
  endpointContent: EndpointContent
  /** 中间任务格数量（不含起点、终点区、终点）。 */
  boardSize: number
  /** 固定位置：格子序号（1..boardSize）→ 类型。 */
  specialCellPositions: Record<number, PositionableType>
  sceneCardPoolNames: string[]
  sceneCards: SceneCard[]
  /** 开局抽取的场景卡数量（前 N 个卡池各抽一张）。 */
  sceneCardCount: number
}

/** 配置里所有任务列表字段。 */
export const CELL_LIST_KEYS = [
  "normalCells",
  "maleCells",
  "femaleCells",
  "truthCells",
  "dareCells",
  "kissCells",
  "hugCells",
  "punishmentCells",
  "rewardCells",
  "effectCells",
  "endpointCells",
] as const satisfies readonly (keyof GameConfig)[]
export type CellListKey = (typeof CELL_LIST_KEYS)[number]

export type Seat = 0 | 1

export interface PlayerState {
  name: string
  gender: Gender
  position: number
  /** 下一次轮到自己时跳过。 */
  skipNext: boolean
}

/** 当前等待完成的任务。 */
export interface PendingTask {
  seat: Seat
  cellIndex: number
  task: GameCell
  /** 已经用过一次「换一个」。 */
  changed: boolean
}

export interface LastRoll {
  /** 单调递增的事件序号，客户端据此触发骰子动画。 */
  id: number
  seat: Seat
  value: number
  from: number
  to: number
}

/** 共享倒计时；运行中用绝对时间 endsAt，避免频繁同步。 */
export interface TimerState {
  duration: number
  /** 运行中时的结束时间（毫秒时间戳），暂停时为 null。 */
  endsAt: number | null
  /** 暂停时剩余秒数。 */
  remaining: number
}

export interface LogEntry {
  id: number
  text: string
}

export interface GameState {
  gameId: string
  /** 完整路径：[起点, ...任务格, ...终点区, 终点]。 */
  board: GameCell[]
  players: [PlayerState, PlayerState]
  turn: Seat
  /** 当前玩家获得再掷一次。 */
  extraRoll: boolean
  pendingTask: PendingTask | null
  lastRoll: LastRoll | null
  winner: Seat | null
  sceneCards: SceneCard[]
  timer: TimerState
  log: LogEntry[]
  seq: number
}

/** 一局游戏的完整快照（配置 + 状态），引擎在其上做纯函数变换。 */
export interface GameSnapshot {
  config: GameConfig
  state: GameState
}

export type TimerOp = "start" | "pause" | "reset"

export type GameAction =
  | { type: "roll" }
  | { type: "completeTask" }
  | { type: "changeTask" }
  | { type: "timer"; op: TimerOp }
  | { type: "timerDuration"; seconds: number }
  | { type: "restart" }
  | { type: "updateConfig"; config: GameConfig }

export interface PlayerProfile {
  name: string
  gender: Gender
}
