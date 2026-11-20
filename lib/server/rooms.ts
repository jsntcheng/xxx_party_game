/**
 * 房间服务：服务端权威地执行游戏操作。
 *
 * 流程：token → 座位 → 校验 baseVersion → 规则引擎 applyAction → CAS 写入 version + 1。
 * 掷骰随机数在服务端生成；版本不一致或规则不允许时返回 409 并附带最新房间。
 */
import type { PublicRoom, RoomPoll, RoomStatus, SeatGrant, ActionResult } from "@/lib/api-types"
import { parseAction } from "@/lib/game/action"
import { secureRng } from "@/lib/game/board"
import { ConfigError, parseGameConfig } from "@/lib/game/config"
import { defaultGameConfig } from "@/lib/game/defaults"
import { applyAction, createGame, RuleError, type ActionContext } from "@/lib/game/engine"
import type { GameConfig, PlayerProfile, Seat } from "@/lib/game/types"
import { AppError } from "./errors"
import { safeEqual } from "./security"
import { getStore, type Room } from "./store"

const ROOM_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const ROOM_ID_LENGTH = 6
/** 轮询间隔 1 秒，MySQL 下在线时间最多 3 秒写一次，留足余量。 */
const ONLINE_WINDOW_MS = 10_000
const CLEANUP_INTERVAL_MS = 10 * 60_000
const ROOM_EXPIRY_MS = Number(process.env.ROOM_EXPIRY_HOURS || 24) * 3_600_000

let lastCleanup = 0

/** 管理员保存的默认配置；未保存或已损坏时回退内置配置。 */
export async function loadDefaultConfig(): Promise<GameConfig> {
  const stored = await getStore().getDefaultConfig()
  if (stored === null) return defaultGameConfig
  try {
    return parseGameConfig(stored)
  } catch (error) {
    console.warn("[config] 已保存的默认配置无效，使用内置配置", error)
    return defaultGameConfig
  }
}

export async function saveDefaultConfig(input: unknown): Promise<GameConfig> {
  const config = parseGameConfig(input)
  await getStore().saveDefaultConfig(config)
  return config
}

function toPublic(room: Room): PublicRoom {
  return { id: room.id, version: room.version, config: room.config, state: room.state }
}

async function statusOf(room: Room, now: number): Promise<RoomStatus> {
  const seen = await getStore().getLastSeen(room.id)
  const seat = (index: Seat) => ({
    taken: room.tokens[index] !== null,
    online: now - seen[index] < ONLINE_WINDOW_MS,
  })
  return { seats: [seat(0), seat(1)], serverTime: now }
}

function seatOf(room: Room, token: string | null): Seat | null {
  if (!token) return null
  if (safeEqual(token, room.tokens[0])) return 0
  if (room.tokens[1] && safeEqual(token, room.tokens[1])) return 1
  return null
}

async function requireRoom(id: string): Promise<Room> {
  const room = await getStore().getRoom(id)
  if (!room) throw new AppError(404, "房间不存在或已过期")
  return room
}

function newRoomId(): string {
  return Array.from({ length: ROOM_ID_LENGTH }, () => ROOM_ID_ALPHABET[Math.floor(secureRng() * ROOM_ID_ALPHABET.length)]).join("")
}

/** 低频清理过期房间；失败只记日志，不影响建房。 */
async function cleanupExpiredRooms(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  try {
    await getStore().deleteRoomsBefore(now - ROOM_EXPIRY_MS)
  } catch (error) {
    console.error("[rooms] 清理过期房间失败", error)
  }
}

export async function createRoom(host: PlayerProfile): Promise<SeatGrant> {
  const store = getStore()
  const now = Date.now()
  await cleanupExpiredRooms(now)

  const config = await loadDefaultConfig()
  const partner: PlayerProfile = { name: "等待加入", gender: host.gender === "male" ? "female" : "male" }
  const token = crypto.randomUUID()

  for (let attempt = 0; attempt < 5; attempt++) {
    const room: Room = {
      id: newRoomId(),
      version: 1,
      config,
      state: createGame(config, [host, partner], secureRng),
      tokens: [token, null],
      createdAt: now,
      updatedAt: now,
    }
    if (await store.createRoom(room)) {
      await store.touchSeat(room.id, 0, now)
      return { token, seat: 0, room: toPublic(room), ...(await statusOf(room, now)) }
    }
  }
  throw new Error("房间号连续冲突")
}

/** 加入房间；持有本房间 token 时视为重连。 */
export async function joinRoom(id: string, guest: PlayerProfile, token: string | null): Promise<SeatGrant> {
  const store = getStore()
  for (let attempt = 0; attempt < 3; attempt++) {
    const room = await requireRoom(id)
    const now = Date.now()
    const existing = seatOf(room, token)
    if (existing !== null) {
      await store.touchSeat(id, existing, now)
      return { token: room.tokens[existing]!, seat: existing, room: toPublic(room), ...(await statusOf(room, now)) }
    }
    if (room.tokens[1] !== null) throw new AppError(409, "房间已满")

    const guestToken = crypto.randomUUID()
    const players = [...room.state.players] as typeof room.state.players
    players[1] = { ...players[1], name: guest.name, gender: guest.gender }
    const seq = room.state.seq + 1
    const next: Room = {
      ...room,
      version: room.version + 1,
      tokens: [room.tokens[0], guestToken],
      state: { ...room.state, players, seq, log: [...room.state.log, { id: seq, text: `${guest.name} 加入了房间 💞` }] },
      updatedAt: now,
    }
    if (await store.updateRoom(next, room.version)) {
      await store.touchSeat(id, 1, now)
      return { token: guestToken, seat: 1, room: toPublic(next), ...(await statusOf(next, now)) }
    }
  }
  throw new AppError(409, "房间正忙，请重试")
}

/** 轮询：顺带记录在线状态；版本没变时不回传房间内容。 */
export async function pollRoom(id: string, token: string | null, since: number): Promise<RoomPoll> {
  const room = await requireRoom(id)
  const now = Date.now()
  const seat = seatOf(room, token)
  if (seat !== null) await getStore().touchSeat(id, seat, now)
  return { room: room.version === since ? null : toPublic(room), seat, ...(await statusOf(room, now)) }
}

export async function performAction(
  id: string,
  token: string | null,
  baseVersion: unknown,
  rawAction: unknown,
): Promise<ActionResult> {
  const action = parseAction(rawAction)
  const room = await requireRoom(id)
  const seat = seatOf(room, token)
  if (seat === null) throw new AppError(403, "你不在这个房间里")

  const conflict = (message: string) => new AppError(409, message, toPublic(room))
  if (baseVersion !== room.version) throw conflict("对方刚刚有操作，已为你同步最新状态")
  if (action.type === "roll" && room.tokens[1] === null) throw conflict("等另一半加入后才能开始哦")

  const now = Date.now()
  const ctx: ActionContext = { actor: seat, rng: secureRng, now }
  let snapshot
  try {
    snapshot = applyAction({ config: room.config, state: room.state }, action, ctx)
  } catch (error) {
    if (error instanceof RuleError || error instanceof ConfigError) throw conflict(error.message)
    throw error
  }

  const next: Room = { ...room, ...snapshot, version: room.version + 1, updatedAt: now }
  if (!(await getStore().updateRoom(next, room.version))) {
    const latest = await requireRoom(id)
    throw new AppError(409, "对方刚刚有操作，已为你同步最新状态", toPublic(latest))
  }
  await getStore().touchSeat(id, seat, now)
  return { room: toPublic(next), ...(await statusOf(next, now)) }
}
