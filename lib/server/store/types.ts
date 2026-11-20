import type { GameConfig, GameState, Seat } from "@/lib/game/types"

/** 服务端房间记录。 */
export interface Room {
  id: string
  /** 每次写入 +1，用于乐观锁与轮询增量。 */
  version: number
  config: GameConfig
  state: GameState
  /** 座位凭证；座位 1 未加入时为 null。 */
  tokens: [string, string | null]
  createdAt: number
  updatedAt: number
}

/** 存储抽象：JSON 文件（单机）或 MySQL。 */
export interface RoomStore {
  getRoom(id: string): Promise<Room | null>
  /** 房间号已存在时返回 false。 */
  createRoom(room: Room): Promise<boolean>
  /** CAS 写入：仅当当前版本等于 expectedVersion 时成功。 */
  updateRoom(room: Room, expectedVersion: number): Promise<boolean>
  /** 删除 updatedAt 早于 timestamp 的房间及其在线记录。 */
  deleteRoomsBefore(timestamp: number): Promise<void>
  /** 记录座位最近一次轮询时间（在线状态，不影响 version）。 */
  touchSeat(roomId: string, seat: Seat, now: number): Promise<void>
  /** 两个座位最近一次轮询时间，未出现过为 0。 */
  getLastSeen(roomId: string): Promise<[number, number]>
  /** 管理员保存的默认配置原始 JSON（未校验）。 */
  getDefaultConfig(): Promise<unknown | null>
  saveDefaultConfig(config: GameConfig): Promise<void>
}
