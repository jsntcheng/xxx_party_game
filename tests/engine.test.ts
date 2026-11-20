import { describe, expect, it } from "vitest"
import { generateBoard } from "@/lib/game/board"
import { defaultGameConfig } from "@/lib/game/defaults"
import { applyAction, canChangeTask, RuleError, timerRemaining, type ActionContext } from "@/lib/game/engine"
import { TILE_LABELS } from "@/lib/game/meta"
import { BACK_TO_START, type GameAction, type GameConfig, type GameSnapshot, type Seat } from "@/lib/game/types"
import { diceRng, newSnapshot, seededRng, seqRng, withCell } from "./helpers"

const ctx = (patch: Partial<ActionContext> = {}): ActionContext => ({ actor: null, rng: seededRng(), now: 0, ...patch })
const act = (snapshot: GameSnapshot, action: GameAction, patch?: Partial<ActionContext>) =>
  applyAction(snapshot, action, ctx(patch))
const rollTo = (snapshot: GameSnapshot, value: number) => act(snapshot, { type: "roll" }, { rng: diceRng(value) })
const plain = { content: "牵手十秒", type: "normal" as const, player: "both" as const }

describe("棋盘生成", () => {
  it("路径 = 起点 + boardSize 个任务格 + 终点区 + 终点，id 等于下标", () => {
    const board = generateBoard(defaultGameConfig, seededRng())
    const zone = Math.min(defaultGameConfig.endpointCells.length, 6)
    expect(board).toHaveLength(defaultGameConfig.boardSize + zone + 2)
    expect(board[0].type).toBe("start")
    expect(board.at(-1)?.type).toBe("end")
    board.forEach((cell, index) => expect(cell.id).toBe(index))
  })

  it("甜蜜任务格只占位，不预先发任务", () => {
    const sweet = generateBoard(defaultGameConfig, seededRng()).filter((cell) => cell.type === "normal")
    expect(sweet.length).toBeGreaterThan(0)
    sweet.forEach((cell) => expect(cell.content).toBe(TILE_LABELS.normal.name))
  })

  it("卡池为空的固定位置退化为甜蜜任务格", () => {
    const board = generateBoard({ ...defaultGameConfig, kissCells: [], specialCellPositions: { 3: "kiss" } }, seededRng())
    expect(board[3].type).toBe("normal")
  })

  it("固定位置的格子类型正确", () => {
    const board = generateBoard(defaultGameConfig, seededRng(7))
    for (const [position, type] of Object.entries(defaultGameConfig.specialCellPositions)) {
      expect(board[Number(position)].type).toBe(type)
    }
  })
})

describe("掷骰与任务", () => {
  it("掷骰前进并生成待完成任务，完成前不换人", () => {
    const start = withCell(newSnapshot(), 4, plain)
    const rolled = rollTo(start, 4)
    expect(rolled.state.players[0].position).toBe(4)
    expect(rolled.state.pendingTask?.cellIndex).toBe(4)
    expect(rolled.state.turn).toBe(0)
    expect(() => rollTo(rolled, 3)).toThrow(RuleError)

    const done = act(rolled, { type: "completeTask" })
    expect(done.state.pendingTask).toBeNull()
    expect(done.state.turn).toBe(1)
  })

  it("效果只在完成任务时结算一次", () => {
    const start = withCell(newSnapshot(), 3, { content: "前进 2 格", type: "forward", player: "both", effect: { type: "move", value: 2 } })
    const rolled = rollTo(start, 3)
    expect(rolled.state.players[0].position).toBe(3)
    const done = act(rolled, { type: "completeTask" })
    expect(done.state.players[0].position).toBe(5)
    expect(done.state.pendingTask).toBeNull()
  })

  it("回到起点", () => {
    const start = withCell(newSnapshot(), 2, { content: "回到起点", type: "backward", player: "both", effect: { type: "move", value: BACK_TO_START } })
    const done = act(rollTo(start, 2), { type: "completeTask" })
    expect(done.state.players[0].position).toBe(0)
  })

  it("停一轮：对方回合结束后跳过被停的一方", () => {
    const start = withCell(withCell(newSnapshot(), 1, { content: "停一轮", type: "skip", player: "both", effect: { type: "skip" } }), 2, plain)
    let s = act(rollTo(start, 1), { type: "completeTask" }) // 小红停一轮
    expect(s.state.players[0].skipNext).toBe(true)
    expect(s.state.turn).toBe(1)
    s = act(rollTo(s, 2), { type: "completeTask" }) // 小明完成后，小红被跳过
    expect(s.state.turn).toBe(1)
    expect(s.state.players[0].skipNext).toBe(false)
  })

  it("再掷一次：回合保留给自己", () => {
    const start = withCell(newSnapshot(), 2, { content: "再掷一次", type: "again", player: "both", effect: { type: "again" } })
    const s = act(rollTo(start, 2), { type: "completeTask" })
    expect(s.state.turn).toBe(0)
    expect(s.state.extraRoll).toBe(true)
  })

  it("交换位置", () => {
    let s = withCell(withCell(newSnapshot(), 5, plain), 3, { content: "交换", type: "swap", player: "both", effect: { type: "swap" } })
    s = act(rollTo(s, 5), { type: "completeTask" }) // 小红到 5
    s = act(rollTo(s, 3), { type: "completeTask" }) // 小明到 3 后交换
    expect(s.state.players.map((p) => p.position)).toEqual([3, 5])
  })

  it("到达终点获胜，之后不能再掷骰", () => {
    const base = newSnapshot()
    const goal = base.state.board.length - 1
    const players = base.state.players.map((p, i) => (i === 0 ? { ...p, position: goal - 2 } : p)) as typeof base.state.players
    const won = rollTo({ ...base, state: { ...base.state, players } }, 6)
    expect(won.state.players[0].position).toBe(goal)
    expect(won.state.winner).toBe(0)
    expect(won.state.pendingTask).toBeNull()
    expect(() => rollTo(won, 1)).toThrow("本局已结束")
  })

  it("联机时只能操作自己的回合", () => {
    const start = newSnapshot()
    expect(() => act(start, { type: "roll" }, { actor: 1 as Seat })).toThrow("还没轮到你哦")
    expect(() => act(start, { type: "roll" }, { actor: 0 })).not.toThrow()
  })

  it("异性专属任务自动换成适合自己的", () => {
    const start = withCell(newSnapshot(), 2, { content: "只给男生", type: "truth", player: "male" })
    const rolled = rollTo(start, 2)
    expect(rolled.state.pendingTask?.task.player).not.toBe("male")
    expect(rolled.state.pendingTask?.task.id).toBe(2)
  })
})

/** 能区分任务来源的甜蜜任务配置。 */
const sweetConfig: GameConfig = {
  ...defaultGameConfig,
  normalCells: [
    { id: 1, content: "通用任务", type: "normal", player: "both" },
    { id: 2, content: "普通里的男生任务", type: "normal", player: "male" },
  ],
  maleCells: [{ id: 1, content: "男生专属", type: "normal", player: "male" }],
  femaleCells: [{ id: 1, content: "女生专属", type: "normal", player: "female" }],
}

/** 掷出 2 点落到甜蜜任务格，pick 决定从抽取范围里取哪一条。 */
function landOnSweet(config: GameConfig, seat: Seat, pick: number): GameSnapshot {
  const base = withCell(newSnapshot(config), 2, plain)
  return act({ ...base, state: { ...base.state, turn: seat } }, { type: "roll" }, { rng: seqRng(diceRng(2)(), pick) })
}

const drawnContents = (seat: Seat) =>
  new Set([0, 0.34, 0.67, 0.99].map((pick) => landOnSweet(sweetConfig, seat, pick).state.pendingTask?.task.content))

describe("甜蜜任务", () => {
  it("落到时按性别现抽：普通任务中适合自己的 + 自己的专属任务", () => {
    expect(drawnContents(0)).toEqual(new Set(["通用任务", "女生专属"])) // 小红
    expect(drawnContents(1)).toEqual(new Set(["通用任务", "普通里的男生任务", "男生专属"])) // 小明
  })

  it("抽到的任务记在落点格上", () => {
    const rolled = landOnSweet(sweetConfig, 0, 0)
    expect(rolled.state.pendingTask?.task.id).toBe(2)
    expect(rolled.state.pendingTask?.task.type).toBe("normal")
  })

  it("可以从同一范围换成另一条，且只能换一次", () => {
    const rolled = landOnSweet(sweetConfig, 0, 0)
    expect(rolled.state.pendingTask?.task.content).toBe("通用任务")
    expect(canChangeTask(rolled)).toBe(true)
    const changed = act(rolled, { type: "changeTask" })
    expect(changed.state.pendingTask?.task.content).toBe("女生专属")
    expect(changed.state.pendingTask?.changed).toBe(true)
    expect(canChangeTask(changed)).toBe(false)
    expect(() => act(changed, { type: "changeTask" })).toThrow("每个任务只能换一次")
  })

  it("没有其他任务可换时不能换", () => {
    const rolled = landOnSweet({ ...sweetConfig, femaleCells: [] }, 0, 0)
    expect(canChangeTask(rolled)).toBe(false)
    expect(() => act(rolled, { type: "changeTask" })).toThrow("没有可替换的任务")
  })

  it("非甜蜜任务不能换", () => {
    const rolled = rollTo(withCell(newSnapshot(), 2, { content: "真心话", type: "truth", player: "both" }), 2)
    expect(canChangeTask(rolled)).toBe(false)
    expect(() => act(rolled, { type: "changeTask" })).toThrow("只有甜蜜任务可以换")
  })

  it("抽取范围为空时休息一下", () => {
    const rolled = landOnSweet({ ...sweetConfig, normalCells: [], femaleCells: [] }, 0, 0)
    expect(rolled.state.pendingTask?.task.content).toContain("休息")
    expect(canChangeTask(rolled)).toBe(false)
  })
})

describe("计时器", () => {
  it("开始、暂停、继续、重置", () => {
    let s = newSnapshot()
    s = act(s, { type: "timerDuration", seconds: 30 })
    s = act(s, { type: "timer", op: "start" }, { now: 1_000 })
    expect(s.state.timer.endsAt).toBe(31_000)
    expect(timerRemaining(s.state.timer, 11_000)).toBe(20)

    s = act(s, { type: "timer", op: "pause" }, { now: 11_000 })
    expect(s.state.timer).toMatchObject({ endsAt: null, remaining: 20 })
    s = act(s, { type: "timer", op: "start" }, { now: 50_000 })
    expect(s.state.timer.endsAt).toBe(70_000)

    s = act(s, { type: "timer", op: "reset" })
    expect(s.state.timer).toEqual({ duration: 30, endsAt: null, remaining: 30 })
  })

  it("时长越界报错", () => {
    expect(() => act(newSnapshot(), { type: "timerDuration", seconds: 0 })).toThrow(RuleError)
    expect(() => act(newSnapshot(), { type: "timerDuration", seconds: 1.5 })).toThrow(RuleError)
  })
})

describe("重新开始与改配置", () => {
  it("重新开始保留玩家和计时时长", () => {
    let s = act(newSnapshot(), { type: "timerDuration", seconds: 90 })
    s = act(rollTo(withCell(s, 3, plain), 3), { type: "completeTask" })
    const restarted = act(s, { type: "restart" }, { rng: seededRng(99) })
    expect(restarted.state.gameId).not.toBe(s.state.gameId)
    expect(restarted.state.players.map((p) => [p.name, p.position])).toEqual([
      ["小红", 0],
      ["小明", 0],
    ])
    expect(restarted.state.timer.duration).toBe(90)
  })

  it("还没掷骰时改配置立即重新生成棋盘", () => {
    const config = { ...defaultGameConfig, boardSize: 20 }
    const s = act(newSnapshot(), { type: "updateConfig", config })
    expect(s.config.boardSize).toBe(20)
    expect(s.state.board.length).toBeLessThan(newSnapshot().state.board.length)
  })

  it("对局中改配置只在下一局生效", () => {
    const started = act(rollTo(withCell(newSnapshot(), 3, plain), 3), { type: "completeTask" })
    const s = act(started, { type: "updateConfig", config: { ...defaultGameConfig, boardSize: 20 } })
    expect(s.config.boardSize).toBe(20)
    expect(s.state.board).toBe(started.state.board)
    expect(s.state.log.at(-1)?.text).toBe("配置已更新，下一局生效")
  })
})
