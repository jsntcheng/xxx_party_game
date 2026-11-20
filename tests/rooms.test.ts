import os from "node:os"
import path from "node:path"
import { promises as fs } from "node:fs"
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { SeatGrant } from "@/lib/api-types"
import { AppError } from "@/lib/server/errors"
import { FileStore } from "@/lib/server/store/file-store"
import { PLAYERS } from "./helpers"

const dir = await fs.mkdtemp(path.join(os.tmpdir(), "party-rooms-"))
let store = new FileStore(path.join(dir, "rooms.json"))

vi.mock("@/lib/server/store", () => ({ getStore: () => store }))
const rooms = await import("@/lib/server/rooms")

afterAll(() => fs.rm(dir, { recursive: true, force: true }))
beforeEach(() => {
  store = new FileStore(path.join(dir, `rooms-${Math.random()}.json`))
  delete process.env.ADMIN_PASSWORD
})

async function expectAppError(promise: Promise<unknown>, status: number, message?: string) {
  const error = await promise.catch((e: unknown) => e)
  expect(error).toBeInstanceOf(AppError)
  expect((error as AppError).status).toBe(status)
  if (message) expect((error as AppError).message).toBe(message)
  return error as AppError
}

async function openRoom(): Promise<[SeatGrant, SeatGrant]> {
  const host = await rooms.createRoom(PLAYERS[0])
  const guest = await rooms.joinRoom(host.room.id, PLAYERS[1], null)
  return [host, guest]
}

describe("建房与加入", () => {
  it("房主坐 0 号位，对方坐 1 号位，房间满后拒绝第三人", async () => {
    const host = await rooms.createRoom(PLAYERS[0])
    expect(host.seat).toBe(0)
    expect(host.room.id).toMatch(/^[A-Z0-9]{6}$/)
    expect(host.seats).toEqual([
      { taken: true, online: true },
      { taken: false, online: false },
    ])

    const guest = await rooms.joinRoom(host.room.id, PLAYERS[1], null)
    expect(guest.seat).toBe(1)
    expect(guest.room.version).toBe(host.room.version + 1)
    expect(guest.room.state.players[1].name).toBe("小明")

    await expectAppError(rooms.joinRoom(host.room.id, { name: "路人", gender: "male" }, null), 409, "房间已满")
  })

  it("持有 token 重连回到原座位，不改变房间", async () => {
    const [host, guest] = await openRoom()
    const again = await rooms.joinRoom(host.room.id, PLAYERS[1], guest.token)
    expect(again.seat).toBe(1)
    expect(again.token).toBe(guest.token)
    expect(again.room.version).toBe(guest.room.version)
  })

  it("房间不存在返回 404", async () => {
    await expectAppError(rooms.joinRoom("ZZZZZZ", PLAYERS[1], null), 404)
    await expectAppError(rooms.pollRoom("ZZZZZZ", null, 0), 404)
  })
})

describe("操作与版本", () => {
  it("服务端掷骰并递增版本，轮询按版本增量返回", async () => {
    const [host, guest] = await openRoom()
    const result = await rooms.performAction(host.room.id, host.token, guest.room.version, { type: "roll" })
    expect(result.room.version).toBe(guest.room.version + 1)
    expect(result.room.state.lastRoll?.seat).toBe(0)

    const stale = await rooms.pollRoom(host.room.id, guest.token, guest.room.version)
    expect(stale.room?.version).toBe(result.room.version)
    expect(stale.seat).toBe(1)
    const fresh = await rooms.pollRoom(host.room.id, guest.token, result.room.version)
    expect(fresh.room).toBeNull()
  })

  it("baseVersion 落后时 409 并附带最新房间", async () => {
    const [host, guest] = await openRoom()
    const error = await expectAppError(
      rooms.performAction(host.room.id, host.token, host.room.version, { type: "roll" }),
      409,
      "对方刚刚有操作，已为你同步最新状态",
    )
    expect(error.room?.version).toBe(guest.room.version)
  })

  it("不在房间里 403，没轮到自己 409，对方未加入不能掷骰", async () => {
    const host = await rooms.createRoom(PLAYERS[0])
    await expectAppError(
      rooms.performAction(host.room.id, host.token, host.room.version, { type: "roll" }),
      409,
      "等另一半加入后才能开始哦",
    )

    const guest = await rooms.joinRoom(host.room.id, PLAYERS[1], null)
    const v = guest.room.version
    await expectAppError(rooms.performAction(host.room.id, "bad-token", v, { type: "roll" }), 403)
    await expectAppError(rooms.performAction(host.room.id, guest.token, v, { type: "roll" }), 409, "还没轮到你哦")
  })

  it("非法操作返回 ConfigError（由路由映射为 400）", async () => {
    const [host, guest] = await openRoom()
    await expect(rooms.performAction(host.room.id, host.token, guest.room.version, { type: "cheat" })).rejects.toThrow(
      "未知操作",
    )
  })

  it("并发提交只有一个成功", async () => {
    const [host, guest] = await openRoom()
    const v = guest.room.version
    const results = await Promise.allSettled([
      rooms.performAction(host.room.id, host.token, v, { type: "timer", op: "start" }),
      rooms.performAction(host.room.id, guest.token, v, { type: "timer", op: "start" }),
    ])
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
  })
})

describe("默认配置", () => {
  it("未保存时使用内置配置，保存后新房间使用新配置", async () => {
    const { defaultGameConfig } = await import("@/lib/game/defaults")
    expect(await rooms.loadDefaultConfig()).toBe(defaultGameConfig)

    await rooms.saveDefaultConfig({ ...defaultGameConfig, boardSize: 20 })
    const host = await rooms.createRoom(PLAYERS[0])
    expect(host.room.config.boardSize).toBe(20)
  })

  it("已保存的配置损坏时回退内置配置", async () => {
    await store.saveDefaultConfig({ boardSize: "坏掉了" } as never)
    const { defaultGameConfig } = await import("@/lib/game/defaults")
    vi.spyOn(console, "warn").mockImplementation(() => undefined)
    expect(await rooms.loadDefaultConfig()).toBe(defaultGameConfig)
  })
})
