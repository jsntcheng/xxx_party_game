/**
 * 规则引擎：applyAction(snapshot, action, ctx) → 新快照。
 *
 * 纯函数，前端本地模式与服务端房间共用同一份规则。
 *
 * 规则：
 * - 双方轮流掷骰（1~6）前进，到达或越过终点即获胜。
 * - 落在格子上必须完成任务，完成后才结算效果（前进/后退/回起点/停一轮/再掷/交换）。
 * - 效果造成的移动不会触发新格子的任务；被效果送到终点同样获胜。
 * - 「停一轮」：轮到该玩家时跳过一次，由对方继续掷骰。
 * - 甜蜜任务格落到时才抽任务，范围是普通任务中适合自己的 + 自己性别的专属任务；可以「换一个」一次。
 * - 其他格子落到只适用异性的任务时，自动换成同类型里适合自己的任务（若有）。
 */
import { drawSceneCards, generateBoard, pickOne, poolOf, suitsAudience, type Rng } from "./board"
import { TILE_LABELS } from "./meta"
import {
  BACK_TO_START,
  type GameAction,
  type GameCell,
  type GameConfig,
  type GameSnapshot,
  type GameState,
  type PendingTask,
  type PlayerProfile,
  type PlayerState,
  type Seat,
  type TaskType,
  type TimerOp,
  type TimerState,
} from "./types"

const DEFAULT_TIMER_SECONDS = 60
export const TIMER_MAX_SECONDS = 3600
const LOG_LIMIT = 30

/** 违反规则的操作（不是你的回合、任务未完成等），对应 HTTP 409。 */
export class RuleError extends Error {}

export interface ActionContext {
  /** 发起操作的座位；null 表示本地同屏模式（任何人都可操作）。 */
  actor: Seat | null
  rng: Rng
  now: number
}

export const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0)
const lastIndex = (state: GameState) => state.board.length - 1

function randomId(rng: Rng): string {
  return Math.floor(rng() * 2 ** 48)
    .toString(36)
    .padStart(10, "0")
}

function newPlayer(profile: PlayerProfile): PlayerState {
  return { name: profile.name, gender: profile.gender, position: 0, skipNext: false }
}

export function createGame(config: GameConfig, players: [PlayerProfile, PlayerProfile], rng: Rng): GameState {
  return {
    gameId: randomId(rng),
    board: generateBoard(config, rng),
    players: [newPlayer(players[0]), newPlayer(players[1])],
    turn: 0,
    extraRoll: false,
    pendingTask: null,
    lastRoll: null,
    winner: null,
    sceneCards: drawSceneCards(config, rng),
    timer: { duration: DEFAULT_TIMER_SECONDS, endsAt: null, remaining: DEFAULT_TIMER_SECONDS },
    log: [{ id: 1, text: "新的一局开始啦，祝你们玩得开心 💕" }],
    seq: 1,
  }
}

/** 追加日志并推进事件序号。 */
function withLog(state: GameState, text: string): GameState {
  const seq = state.seq + 1
  return { ...state, seq, log: [...state.log, { id: seq, text }].slice(-LOG_LIMIT) }
}

function updatePlayer(state: GameState, seat: Seat, patch: Partial<PlayerState>): GameState {
  const players = [...state.players] as GameState["players"]
  players[seat] = { ...players[seat], ...patch }
  return { ...state, players }
}

function assertActor(ctx: ActionContext, seat: Seat, message: string) {
  if (ctx.actor !== null && ctx.actor !== seat) throw new RuleError(message)
}

/** 所有卡池都为空时，甜蜜任务格的兜底内容。 */
const REST_CONTENT = "这一格没有任务，休息一下"

/** 甜蜜任务的抽取范围：普通任务中适合自己的 + 自己性别的专属任务。 */
function sweetPool(config: GameConfig, player: PlayerState): GameCell[] {
  const exclusive = player.gender === "male" ? config.maleCells : config.femaleCells
  return [...config.normalCells.filter((cell) => suitsAudience(cell.player, player.gender)), ...exclusive]
}

/** 落到某格时要做的任务：甜蜜任务现抽；其他格子是异性专属时，换成同类型中适合自己的。 */
function taskFor(tile: GameCell, player: PlayerState, config: GameConfig, rng: Rng): GameCell {
  if (tile.type === "normal") {
    const drawn = pickOne(sweetPool(config, player), rng)
    return drawn ? { ...drawn, id: tile.id } : { ...tile, content: REST_CONTENT }
  }
  if (suitsAudience(tile.player, player.gender) || tile.type === "start" || tile.type === "end") return tile
  const candidates = poolOf(config, tile.type as TaskType).filter((cell) => suitsAudience(cell.player, player.gender))
  const replacement = pickOne(candidates, rng)
  return replacement ? { ...replacement, id: tile.id } : tile
}

/** 结束当前回合：处理对方「停一轮」后决定下一位。 */
function passTurn(state: GameState): GameState {
  const next = other(state.turn)
  const base = { ...state, extraRoll: false }
  if (!state.players[next].skipNext) return { ...base, turn: next }
  const skipped = updatePlayer(base, next, { skipNext: false })
  return withLog(skipped, `${state.players[next].name} 停一轮，${state.players[state.turn].name} 继续`)
}

function declareWinner(state: GameState, seat: Seat): GameState {
  return withLog({ ...state, winner: seat, pendingTask: null, extraRoll: false }, `🎉 ${state.players[seat].name} 到达终点！`)
}

function roll({ config, state }: GameSnapshot, ctx: ActionContext): GameState {
  if (state.winner !== null) throw new RuleError("本局已结束")
  if (state.pendingTask) throw new RuleError("请先完成当前任务")
  assertActor(ctx, state.turn, "还没轮到你哦")

  const seat = state.turn
  const player = state.players[seat]
  const value = 1 + Math.floor(ctx.rng() * 6)
  const from = player.position
  const to = Math.min(from + value, lastIndex(state))

  let next = updatePlayer(state, seat, { position: to })
  next = withLog(next, `${player.name} 掷出 ${value} 点`)
  next = { ...next, extraRoll: false, lastRoll: { id: next.seq, seat, value, from, to } }

  if (to === lastIndex(state)) return declareWinner(next, seat)

  const task = taskFor(state.board[to], player, config, ctx.rng)
  return { ...next, pendingTask: { seat, cellIndex: to, task, changed: false } }
}

function completeTask(state: GameState): GameState {
  const pending = state.pendingTask
  if (!pending) throw new RuleError("当前没有任务")

  const { seat, task } = pending
  const name = state.players[seat].name
  let next: GameState = { ...state, pendingTask: null }
  const effect = task.effect

  if (effect?.type === "move") {
    const target =
      effect.value === BACK_TO_START ? 0 : Math.max(0, Math.min(next.players[seat].position + effect.value, lastIndex(state)))
    next = updatePlayer(next, seat, { position: target })
    const verb = effect.value === BACK_TO_START ? "回到起点" : effect.value > 0 ? `前进 ${effect.value} 格` : `后退 ${-effect.value} 格`
    next = withLog(next, `${name} ${verb}`)
    if (target === lastIndex(state)) return declareWinner(next, seat)
  } else if (effect?.type === "skip") {
    next = withLog(updatePlayer(next, seat, { skipNext: true }), `${name} 下一轮暂停`)
  } else if (effect?.type === "swap") {
    const [a, b] = next.players
    next = updatePlayer(updatePlayer(next, 0, { position: b.position }), 1, { position: a.position })
    next = withLog(next, `${name} 与对方交换了位置`)
  } else if (effect?.type === "again") {
    return withLog({ ...next, turn: seat, extraRoll: true }, `${name} 获得再掷一次`)
  }

  return passTurn({ ...next, turn: seat })
}

/** 「换一个」的候选：同一抽取范围里内容不同的任务。 */
function changeCandidates(config: GameConfig, pending: PendingTask, player: PlayerState): GameCell[] {
  return sweetPool(config, player).filter((cell) => cell.content !== pending.task.content)
}

/** 当前任务能否「换一个」：仅甜蜜任务格、每格一次、且有候选。 */
export function canChangeTask({ config, state }: GameSnapshot): boolean {
  const pending = state.pendingTask
  return (
    pending !== null &&
    !pending.changed &&
    pending.task.type === "normal" &&
    changeCandidates(config, pending, state.players[pending.seat]).length > 0
  )
}

function changeTask({ config, state }: GameSnapshot, ctx: ActionContext): GameState {
  const pending = state.pendingTask
  if (!pending) throw new RuleError("当前没有任务")
  if (pending.changed) throw new RuleError("每个任务只能换一次")
  if (pending.task.type !== "normal") throw new RuleError("只有甜蜜任务可以换")
  assertActor(ctx, pending.seat, "只能由当前玩家换任务")

  const player = state.players[pending.seat]
  const replacement = pickOne(changeCandidates(config, pending, player), ctx.rng)
  if (!replacement) throw new RuleError("没有可替换的任务")

  return withLog(
    { ...state, pendingTask: { ...pending, task: { ...replacement, id: pending.cellIndex }, changed: true } },
    `${player.name} 换了一个${TILE_LABELS.normal.name}`,
  )
}

export function timerRemaining(timer: TimerState, now: number): number {
  if (timer.endsAt === null) return timer.remaining
  return Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
}

function applyTimer(timer: TimerState, op: TimerOp, now: number): TimerState {
  switch (op) {
    case "start": {
      if (timer.endsAt !== null) return timer
      const seconds = timer.remaining > 0 ? timer.remaining : timer.duration
      return { ...timer, endsAt: now + seconds * 1000, remaining: seconds }
    }
    case "pause":
      return timer.endsAt === null ? timer : { ...timer, endsAt: null, remaining: timerRemaining(timer, now) }
    case "reset":
      return { ...timer, endsAt: null, remaining: timer.duration }
  }
}

function setTimerDuration(timer: TimerState, seconds: number): TimerState {
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > TIMER_MAX_SECONDS) {
    throw new RuleError(`计时需在 1~${TIMER_MAX_SECONDS} 秒之间`)
  }
  return { duration: seconds, endsAt: null, remaining: seconds }
}

function restart({ config, state }: GameSnapshot, ctx: ActionContext): GameState {
  const fresh = createGame(config, state.players, ctx.rng)
  return { ...fresh, timer: { ...fresh.timer, duration: state.timer.duration, remaining: state.timer.duration } }
}

/** 本局还没人掷过骰子时，新配置立即重新生成棋盘；否则下一局生效。 */
function updateConfig(snapshot: GameSnapshot, config: GameConfig, ctx: ActionContext): GameSnapshot {
  const untouched = snapshot.state.lastRoll === null
  const state = untouched
    ? restart({ config, state: snapshot.state }, ctx)
    : withLog(snapshot.state, "配置已更新，下一局生效")
  return { config, state }
}

export function applyAction(snapshot: GameSnapshot, action: GameAction, ctx: ActionContext): GameSnapshot {
  const { config, state } = snapshot
  switch (action.type) {
    case "roll":
      return { config, state: roll(snapshot, ctx) }
    case "completeTask":
      return { config, state: completeTask(state) }
    case "changeTask":
      return { config, state: changeTask(snapshot, ctx) }
    case "timer":
      return { config, state: { ...state, timer: applyTimer(state.timer, action.op, ctx.now) } }
    case "timerDuration":
      return { config, state: { ...state, timer: setTimerDuration(state.timer, action.seconds) } }
    case "restart":
      return { config, state: restart(snapshot, ctx) }
    case "updateConfig":
      return updateConfig(snapshot, action.config, ctx)
  }
}
